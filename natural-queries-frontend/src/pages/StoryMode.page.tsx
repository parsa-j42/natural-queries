import { useEffect, useState } from 'react';
import {
  Accordion,
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Code,
  Collapse,
  Container,
  Group,
  List,
  MultiSelect,
  Paper,
  PasswordInput,
  SegmentedControl,
  Select,
  Stack,
  Stepper,
  Tabs,
  Text,
  Textarea,
  ThemeIcon,
  Timeline,
  Title,
  Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconAlertCircle,
  IconArrowLeft,
  IconArrowRight,
  IconBook2,
  IconBooks,
  IconBrain,
  IconBulb,
  IconCheck,
  IconCircleCheck,
  IconDatabase,
  IconRefresh,
  IconTable,
  IconWand,
} from '@tabler/icons-react';
import { fetchProviders, type ModelInfo } from '@/API/client';
import { ResultsColumn, ResultsPanel } from '@/components/Results/ResultsPanel';
import SchemaViewer from '@/components/SchemaViewer/SchemaViewer';
import { useSchemaViewer } from '@/contexts/SchemaContext';
import { QueryResult, runQuery, warmUp } from '@/db/duckdb';
import { formatCell } from '@/db/format';
import { gradeQuery } from '@/db/grade';
import { brand } from '@/theme/colors';
import {
  generateMultiChapterStory,
  generateSingleStory,
  getRandomSelection,
  type MultiChapterStory,
  type Story,
  type StoryStep,
} from '../API/StoryModeAPI';
import classes from './StoryMode.module.css';

// Turns a snake_case option value into a Title Case label.
const toLabel = (value: string) =>
  value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const elementOptions = ['well_locations', 'chemical_analysis', 'well_ownership', 'drilling_info', 'water_quality'].map(
  (value) => ({ value, label: toLabel(value) })
);

const skillOptions = ['basic_select', 'joins', 'aggregates', 'complex_conditions', 'temporal_analysis'].map(
  (value) => ({ value, label: toLabel(value) })
);

const difficultyOptions = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export function StoryMode() {
  // Setup selections
  const [activeTab, setActiveTab] = useState<'single' | 'multi'>('single');
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');

  // Model selection for generation (grading runs locally and needs no model).
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');

  // Story state
  const [singleStory, setSingleStory] = useState<Story | null>(null);
  const [multiStory, setMultiStory] = useState<MultiChapterStory | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [userQuery, setUserQuery] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showResults, setShowResults] = useState(true);

  // Progress tracking
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [chapterProgress, setChapterProgress] = useState<number[]>([]);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);

  // Query execution
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const { isOpen, openSchema, closeSchema } = useSchemaViewer();
  const isMobile = useMediaQuery('(max-width: 48em)');

  // Warm up the wasm engine (used for execution and grading) and load the model
  // list for the generation picker.
  useEffect(() => {
    warmUp();
    fetchProviders()
      .then((data) => {
        setModels(data.models);
        setSelectedModel((current) => current ?? data.default);
      })
      .catch(() => {
        notifications.show({
          title: 'Backend unavailable',
          message: 'Could not reach the generation service. Stories cannot be generated right now.',
          color: 'yellow',
        });
      });
  }, []);

  const selectedModelInfo = models.find((model) => model.id === selectedModel) ?? null;
  const needsKey = selectedModelInfo?.byok_only ?? false;

  const modelOptions = (() => {
    const groupLabels: Record<string, string> = {
      groq: 'Groq',
      google: 'Google Gemini',
      anthropic: 'Anthropic (bring your own key)',
    };
    const groups = new Map<string, { value: string; label: string }[]>();
    for (const model of models) {
      const group = groupLabels[model.provider] ?? model.provider;
      const items = groups.get(group) ?? [];
      items.push({ value: model.id, label: model.label });
      groups.set(group, items);
    }
    return Array.from(groups, ([group, items]) => ({ group, items }));
  })();

  useEffect(() => {
    if (multiStory && multiStory.chapters) {
      const newProgress = multiStory.chapters.map((chapter, chapterIndex) => {
        const completedStepsInChapter = [...completedSteps].filter((step) =>
          step.startsWith(`${chapterIndex}-`)
        ).length;
        return chapter.steps ? Math.min((completedStepsInChapter / chapter.steps.length) * 100, 100) : 0;
      });
      setChapterProgress(newProgress);
    }
  }, [multiStory, completedSteps]);

  const handleRandomSelection = () => {
    const { elements, skills } = getRandomSelection(difficulty);
    setSelectedElements(elements);
    setSelectedSkills(skills);

    notifications.show({
      title: 'Random Selection',
      message: 'Elements and skills have been randomly selected based on difficulty',
      color: brand.story,
    });
  };

  const markStepComplete = (chapterIndex: number, stepIndex: number) => {
    setCompletedSteps((prev) => {
      const newSet = new Set(prev);
      newSet.add(`${chapterIndex}-${stepIndex}`);
      return newSet;
    });

    if (multiStory) {
      const totalStepsInChapter = multiStory.chapters[chapterIndex].steps.length;
      const completedStepsInChapter =
        [...completedSteps].filter((step) => step.startsWith(`${chapterIndex}-`)).length + 1;

      setChapterProgress((prev) => {
        const newProgress = [...prev];
        newProgress[chapterIndex] = Math.min((completedStepsInChapter / totalStepsInChapter) * 100, 100);
        return newProgress;
      });
    }
  };

  const generateStory = async () => {
    if (needsKey && !apiKey.trim()) {
      notifications.show({
        title: 'API key required',
        message: `${selectedModelInfo?.label} needs your own API key. Enter it to continue.`,
        color: 'yellow',
      });
      return;
    }

    setHasSeenIntro(false);
    setIsGenerating(true);
    try {
      if (!selectedElements.length || !selectedSkills.length) {
        throw new Error('Please select at least one element and skill');
      }

      const options = {
        model: selectedModel ?? undefined,
        apiKey: needsKey ? apiKey.trim() : undefined,
      };

      if (activeTab === 'single') {
        const story = await generateSingleStory(selectedElements, selectedSkills, difficulty, options);
        setSingleStory(story);
        setMultiStory(null);
      } else {
        const story = await generateMultiChapterStory(
          selectedElements,
          selectedSkills,
          difficulty,
          options
        );
        setMultiStory(story);
        setSingleStory(null);
      }

      // Reset all progress when generating a new story
      setCurrentStep(0);
      setCurrentChapter(0);
      setCompletedSteps(new Set());
      setChapterProgress([]);
    } catch (error) {
      notifications.show({
        title: 'Generation Failed',
        message: error instanceof Error ? error.message : 'Failed to generate story',
        color: 'red',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Execute the student's query in DuckDB-WASM for display. Returns whether it
  // ran, so the caller knows whether to attempt grading.
  const executeUserQuery = async (query: string): Promise<boolean> => {
    setIsExecuting(true);
    try {
      const result = await runQuery(query);
      setQueryResults(result);
      setShowResults(true);
      notifications.show({
        title: 'Query Executed',
        message: `Returned ${result.rows.length} row${result.rows.length === 1 ? '' : 's'}`,
        color: 'teal',
        icon: <IconCircleCheck size={16} />,
      });
      return true;
    } catch (error) {
      setQueryResults(null);
      notifications.show({
        title: 'Execution Error',
        message: error instanceof Error ? error.message : 'Failed to execute query',
        color: 'red',
      });
      return false;
    } finally {
      setIsExecuting(false);
    }
  };

  const handleQuerySubmit = async () => {
    if (!userQuery.trim()) {
      notifications.show({
        title: 'Empty Query',
        message: 'Please enter a query first',
        color: 'yellow',
      });
      return;
    }

    // Run it for display first; only grade if it actually executed.
    const ran = await executeUserQuery(userQuery);
    if (!ran) {
      return;
    }

    const step = getCurrentStep();
    if (step) {
      // Grade by comparing result sets against the reference solution.
      const { correct, feedback } = await gradeQuery(userQuery, step.solution);
      if (correct) {
        markStepComplete(currentChapter, currentStep);
      }
      notifications.show({
        title: correct ? 'Correct!' : 'Not quite',
        message: feedback,
        color: correct ? 'teal' : 'yellow',
        icon: correct ? <IconCircleCheck size={16} /> : undefined,
      });
    }
  };

  const handleNextStep = () => {
    if (!hasSeenIntro) {
      setHasSeenIntro(true);
      return;
    }
    if (multiStory?.chapters) {
      const currentChapterObj = multiStory.chapters[currentChapter];
      if (currentStep < (currentChapterObj?.steps?.length ?? 0) - 1) {
        setCurrentStep((prev) => prev + 1);
      } else if (currentChapter < multiStory.chapters.length - 1) {
        setCurrentChapter((prev) => prev + 1);
        setCurrentStep(0);
      }
    } else if (singleStory?.steps && currentStep < singleStory.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
    setUserQuery('');
    setShowSolution(false);
    setShowResults(false);
    setQueryResults(null);
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else if (currentChapter > 0 && multiStory?.chapters) {
      const previousChapterIndex = currentChapter - 1;
      setCurrentChapter(previousChapterIndex);
      setCurrentStep((multiStory.chapters[previousChapterIndex]?.steps?.length ?? 1) - 1);
    }
    setUserQuery('');
    setShowSolution(false);
  };

  const getCurrentStep = (): StoryStep | null => {
    if (multiStory?.chapters?.[currentChapter]?.steps?.[currentStep]) {
      return multiStory.chapters[currentChapter].steps[currentStep];
    }
    return singleStory?.steps?.[currentStep] ?? null;
  };

  const resetStory = () => {
    setSingleStory(null);
    setMultiStory(null);
    setCurrentStep(0);
    setCurrentChapter(0);
    setCompletedSteps(new Set());
    setChapterProgress([]);
    setUserQuery('');
    setShowSolution(false);
    setShowExplanation(true);
  };

  const handleChapterClick = (index: number) => {
    if (index < currentChapter || chapterProgress[index - 1] === 100) {
      setCurrentChapter(index);
      setCurrentStep(0);
      setUserQuery('');
      setShowSolution(false);
    } else {
      notifications.show({
        title: 'Chapter Locked',
        message: 'Please complete the current chapter before moving forward',
        color: 'yellow',
      });
    }
  };

  const renderStoryContent = () => {
    const step = getCurrentStep();
    if (!step) {
      return null;
    }

    const currentStoryContext = multiStory ? multiStory.overall_context : singleStory?.context;
    const resultRows = queryResults?.rows ?? [];
    const resultColumns: ResultsColumn<Record<string, unknown>>[] = (queryResults?.columns ?? []).map(
      (column) => ({
        key: column.name,
        header: column.name,
        render: (row) => formatCell(row[column.name], column.type),
      })
    );

    return (
      <div className={classes.storyContent}>
        <Paper className={classes.storyPanel} withBorder>
          <Stack gap="lg">
            {/* Story overview, shown only at the very beginning */}
            {currentStep === 0 && currentChapter === 0 && multiStory && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Story Overview"
                color={brand.story}
                className={classes.overviewAlert}
              >
                <Text className={classes.storyContext}>{currentStoryContext}</Text>
                <Text size="lg" fw={500} mt="md" mb="xs">
                  Story Elements:
                </Text>
                <List>
                  {multiStory.elements.map((element) => (
                    <List.Item key={element}>{toLabel(element)}</List.Item>
                  ))}
                </List>
                <Text size="lg" fw={500} mt="md" mb="xs">
                  Required Skills:
                </Text>
                <List>
                  {multiStory.skills.map((skill) => (
                    <List.Item key={skill}>{toLabel(skill)}</List.Item>
                  ))}
                </List>
              </Alert>
            )}

            {/* Chapter progress timeline for multi-chapter stories */}
            {multiStory && currentStep === 0 && (
              <Timeline active={currentChapter} bulletSize={24} lineWidth={2}>
                {multiStory.chapters.map((chapter, idx) => (
                  <Timeline.Item
                    key={chapter.title}
                    title={chapter.title}
                    bullet={chapterProgress[idx] === 100 ? <IconCheck size={12} /> : idx + 1}
                  >
                    <Text c="dimmed" size="sm">
                      {chapter.introduction.split('\n')[0]}
                    </Text>
                    <Group gap="xs" mt="xs">
                      <Badge size="sm" color={idx <= currentChapter ? brand.story : 'gray'}>
                        {chapter.steps?.length || 0} Tasks
                      </Badge>
                      <Badge size="sm" color={chapterProgress[idx] === 100 ? 'teal' : 'gray'}>
                        {chapterProgress[idx]}% Complete
                      </Badge>
                    </Group>
                  </Timeline.Item>
                ))}
              </Timeline>
            )}

            {/* Chapter introduction */}
            {currentStep === 0 && (
              <Accordion
                variant="filled"
                defaultValue="chapter-info"
                classNames={{ item: classes.accordionItem, chevron: classes.accordionChevron }}
              >
                <Accordion.Item value="chapter-info">
                  <Accordion.Control>
                    <Title order={3}>
                      {multiStory
                        ? `Chapter ${currentChapter + 1}: ${multiStory.chapters[currentChapter].title}`
                        : singleStory?.title}
                    </Title>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <div className={classes.taskSection}>
                      <Text size="lg" fw={500} mb="xs">
                        Background
                      </Text>
                      <Text mb="xl" className={classes.storyContext}>
                        {multiStory ? multiStory.chapters[currentChapter].introduction : singleStory?.context}
                      </Text>

                      {multiStory?.chapters && (
                        <>
                          <Text size="lg" fw={500} mb="xs">
                            Learning Objectives
                          </Text>
                          <List>
                            {multiStory.chapters[currentChapter].learning_objectives.map((obj) => (
                              <List.Item key={obj}>
                                <Text mb="xs">{obj}</Text>
                              </List.Item>
                            ))}
                          </List>
                        </>
                      )}
                    </div>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            )}

            {/* Current task */}
            <div className={classes.taskSection}>
              <Text size="lg" fw={500} mb="xs">
                Current Situation
              </Text>
              <Text mb="lg">{step.context}</Text>

              <Text size="lg" fw={500} mb="xs">
                Your Assignment
              </Text>
              <Text mb="md">{step.task}</Text>

              <Group mb="xl">
                <Tooltip label="Show Hint">
                  <ActionIcon
                    variant="light"
                    color={brand.story}
                    onClick={() =>
                      notifications.show({
                        title: 'Hint',
                        message: step.hint,
                        color: brand.story,
                        autoClose: 5000,
                        icon: <IconBulb size={16} />,
                      })
                    }
                  >
                    <IconBulb size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Toggle Explanation">
                  <ActionIcon variant="light" color={brand.story} onClick={() => setShowExplanation((prev) => !prev)}>
                    <IconBrain size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="View Schema">
                  <ActionIcon variant="light" color={brand.story} onClick={openSchema}>
                    <IconTable size={18} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <Box mb="xl">
                <Textarea
                  className={classes.queryInput}
                  onChange={(event) => setUserQuery(event.currentTarget.value)}
                  value={userQuery}
                  minRows={4}
                  autosize
                  placeholder="Write your SQL query here..."
                />
                <Group mt="md">
                  <Button color={brand.story} onClick={handleQuerySubmit} loading={isExecuting}>
                    Execute Query
                  </Button>
                  <Button variant="light" color={brand.story} onClick={() => setShowSolution((prev) => !prev)}>
                    {showSolution ? 'Hide' : 'Show'} Solution
                  </Button>
                </Group>
              </Box>

              {queryResults && showResults && (
                <Box mb="md">
                  <ResultsPanel
                    rows={resultRows}
                    columns={resultColumns}
                    height={300}
                    onClose={() => setShowResults(false)}
                  />
                </Box>
              )}

              <Collapse in={showSolution}>
                <Paper className={classes.solutionPanel} withBorder>
                  <Text fw={500} mb="xs">
                    Solution:
                  </Text>
                  <Code block className={classes.solutionCode}>
                    {step.solution.trim()}
                  </Code>
                </Paper>
              </Collapse>

              <Collapse in={showExplanation}>
                <Paper className={classes.explanationPanel} withBorder mt="xl">
                  <Title order={4} mb="md">
                    Query Explanation
                  </Title>
                  <Text mb="md">{step.explanation.overview}</Text>
                  {step.explanation.steps?.map((expStep) => (
                    <div key={expStep.sql} className={classes.explanationStep}>
                      <Code className={classes.stepCode}>{expStep.sql}</Code>
                      <Text size="sm">{expStep.explanation}</Text>
                      {expStep.key_concept && (
                        <Badge color={brand.story} size="sm" mt="xs">
                          {expStep.key_concept}
                        </Badge>
                      )}
                    </div>
                  ))}
                </Paper>
              </Collapse>
            </div>

            {/* Chapter conclusion on the last step */}
            {multiStory && currentStep === (multiStory.chapters[currentChapter]?.steps?.length ?? 0) - 1 && (
              <Alert
                icon={<IconCheck size={16} />}
                title="Chapter Conclusion"
                color="teal"
                className={classes.conclusionAlert}
              >
                <Text>{multiStory.chapters[currentChapter].conclusion}</Text>
              </Alert>
            )}

            {/* Step navigation for multi-chapter stories */}
            {multiStory && (
              <Group justify="space-between">
                <Button
                  variant="light"
                  color={brand.story}
                  leftSection={<IconArrowLeft size={16} />}
                  onClick={handlePreviousStep}
                  disabled={currentStep === 0 && currentChapter === 0}
                >
                  Previous
                </Button>
                <Button
                  color={brand.story}
                  rightSection={<IconArrowRight size={16} />}
                  onClick={handleNextStep}
                  disabled={
                    currentChapter === multiStory.chapters.length - 1 &&
                    currentStep === (multiStory.chapters[currentChapter]?.steps?.length ?? 0) - 1
                  }
                >
                  Next
                </Button>
              </Group>
            )}
          </Stack>
        </Paper>
      </div>
    );
  };

  const renderStorySetup = () => (
    <Paper className={classes.setupPanel} withBorder>
      <Stack>
        <Title order={3} mb="md">
          Create Your Adventure
        </Title>

        <div className={classes.selectionGroup}>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>
              Database Elements
            </Text>
            <ThemeIcon variant="light" color={brand.story}>
              <IconDatabase size={16} />
            </ThemeIcon>
          </Group>
          <MultiSelect
            data={elementOptions}
            value={selectedElements}
            onChange={setSelectedElements}
            placeholder="Select elements to include..."
            searchable
          />
        </div>

        <div className={classes.selectionGroup}>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>
              SQL Skills
            </Text>
            <ThemeIcon variant="light" color={brand.story}>
              <IconBrain size={16} />
            </ThemeIcon>
          </Group>
          <MultiSelect
            data={skillOptions}
            value={selectedSkills}
            onChange={setSelectedSkills}
            placeholder="Select skills to practice..."
            searchable
          />
        </div>

        <div className={classes.selectionGroup}>
          <Text size="sm" fw={500} mb="xs">
            Story Complexity
          </Text>
          <SegmentedControl
            fullWidth
            data={difficultyOptions}
            value={difficulty}
            onChange={(value) => setDifficulty(value as Difficulty)}
            color={brand.story}
          />
        </div>

        <div className={classes.selectionGroup}>
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>
              Model
            </Text>
            <ThemeIcon variant="light" color={brand.story}>
              <IconWand size={16} />
            </ThemeIcon>
          </Group>
          <Select
            data={modelOptions}
            value={selectedModel}
            onChange={setSelectedModel}
            placeholder="Choose a model"
            searchable
            allowDeselect={false}
            disabled={models.length === 0}
          />
          {needsKey && (
            <PasswordInput
              mt="xs"
              label={`${selectedModelInfo?.label} API key`}
              placeholder="Used only for this request"
              value={apiKey}
              onChange={(event) => setApiKey(event.currentTarget.value)}
            />
          )}
          {selectedModelInfo?.notes && (
            <Text size="xs" c="dimmed" mt="xs">
              {selectedModelInfo.notes}
            </Text>
          )}
        </div>

        <Group mt="md">
          <Button leftSection={<IconWand size={16} />} variant="light" color={brand.story} onClick={handleRandomSelection}>
            Random Selection
          </Button>
          <Button
            color={brand.story}
            onClick={generateStory}
            disabled={selectedElements.length === 0 || selectedSkills.length === 0}
            loading={isGenerating}
          >
            Generate Story
          </Button>
        </Group>
      </Stack>
    </Paper>
  );

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }}>
      <Title className={classes.title} ta="center" mb="xl">
        <Text inherit component="span" c={brand.story}>
          SQL Learning Adventure
        </Text>
      </Title>

      {!singleStory && !multiStory ? (
        <Tabs
          color={brand.story}
          value={activeTab}
          onChange={(value) => setActiveTab(value as 'single' | 'multi')}
        >
          <Tabs.List grow>
            <Tabs.Tab value="single" leftSection={<IconBook2 size={16} />}>
              Single Adventure
            </Tabs.Tab>
            <Tabs.Tab value="multi" leftSection={<IconBooks size={16} />}>
              Multi-Chapter Saga
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="single">{renderStorySetup()}</Tabs.Panel>
          <Tabs.Panel value="multi">{renderStorySetup()}</Tabs.Panel>
        </Tabs>
      ) : (
        <Box>
          {multiStory?.chapters && (
            <Stepper
              active={currentChapter}
              onStepClick={handleChapterClick}
              color={brand.story}
              orientation={isMobile ? 'vertical' : 'horizontal'}
            >
              {multiStory.chapters.map((chapter, index) => (
                <Stepper.Step
                  key={chapter.title}
                  label={`Chapter ${index + 1}`}
                  description={chapter.title}
                  completedIcon={completedSteps.has(`${index}-${currentStep}`) ? <IconCheck size={18} /> : undefined}
                  state={chapterProgress[index] === 100 ? 'stepCompleted' : 'stepProgress'}
                />
              ))}
            </Stepper>
          )}
          {renderStoryContent()}
          <Group mt="md">
            <Button variant="subtle" color={brand.story} leftSection={<IconRefresh size={16} />} onClick={resetStory}>
              Start New Adventure
            </Button>
          </Group>
        </Box>
      )}
      <SchemaViewer opened={isOpen} onClose={closeSchema} />
    </Container>
  );
}
