import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Button,
  Card,
  Code,
  Collapse,
  Container,
  Grid,
  Group,
  Paper,
  ScrollArea,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconBookmark,
  IconChevronRight,
  IconCode,
  IconHistory,
  IconTable,
  IconTerminal2,
} from '@tabler/icons-react';
import { ResultsColumn, ResultsPanel } from '@/components/Results/ResultsPanel';
import { useSchemaViewer } from '@/contexts/SchemaContext';
import { brand } from '@/theme/colors';
import { useAccentColor } from '@/theme/useAccentColor';
import SchemaViewer from '../components/SchemaViewer/SchemaViewer';
import { generateExplanation, generateSQL, getMockResults, recentQueries, WellResult } from './PlaygroundMode.mocks';
import classes from './PlaygroundMode.module.css';

const resultColumns: ResultsColumn<WellResult>[] = [
  { key: 'Well_ID', header: 'Well ID' },
  { key: 'Sample_Date', header: 'Sample Date' },
  { key: 'Value', header: 'Iron Value', render: (row) => `${row.Value} mg/L` },
  {
    key: 'location',
    header: 'Location (Lat, Long)',
    render: (row) => `${row.Latitude.toFixed(4)}, ${row.Longitude.toFixed(4)}`,
  },
];

export function PlaygroundMode() {
  const { isOpen, openSchema, closeSchema } = useSchemaViewer();

  const [naturalQuery, setNaturalQuery] = useState('');
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [results, setResults] = useState<WellResult[] | null>(null);
  const [isProcessingNL, setIsProcessingNL] = useState(false);
  const [isExecutingSQL, setIsExecutingSQL] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const accent = useAccentColor();
  const clipboard = useClipboard();

  // Explanation only depends on the natural-language query, so memoize it instead of
  // recomputing on every render.
  const explanation = useMemo(() => generateExplanation(naturalQuery), [naturalQuery]);

  const handleProcessNaturalLanguage = async () => {
    if (!naturalQuery.trim()) {
      notifications.show({
        title: 'Empty Query',
        message: 'Please enter your question first',
        color: 'yellow',
      });
      return;
    }

    setIsProcessingNL(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setGeneratedSQL(generateSQL(naturalQuery));
      setResults(null);
      notifications.show({
        title: 'Query Generated',
        message: 'SQL query is ready to execute',
        color: 'teal',
      });
    } catch {
      notifications.show({
        title: 'Generation Failed',
        message: 'Could not generate SQL query',
        color: 'red',
      });
    } finally {
      setIsProcessingNL(false);
    }
  };

  const handleExecuteSQL = async () => {
    if (!generatedSQL) {
      notifications.show({
        title: 'No SQL Query',
        message: 'Generate a SQL query first',
        color: 'yellow',
      });
      return;
    }

    setIsExecutingSQL(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setResults(getMockResults(naturalQuery));
      notifications.show({
        title: 'Query Executed',
        message: 'Results are ready!',
        color: 'teal',
      });
    } catch {
      notifications.show({
        title: 'Execution Failed',
        message: 'Could not execute SQL query',
        color: 'red',
      });
    } finally {
      setIsExecutingSQL(false);
    }
  };

  const loadHistoryItem = (natural: string) => {
    setNaturalQuery(natural);
    setGeneratedSQL('');
    setResults(null);
  };

  const copySQL = () => {
    clipboard.copy(generatedSQL);
    notifications.show({ message: 'SQL copied to clipboard', color: 'teal' });
  };

  return (
    <Container size="xl" py="xs">
      <div className={classes.header}>
        <Title order={2} className={classes.title}>
          <Text inherit component="span" c={brand.playground}>
            SQL Playground
          </Text>
        </Title>

        <Group gap="xs">
          <Tooltip label="Query History">
            <ActionIcon variant="light" color={accent} onClick={() => setShowHistory((prev) => !prev)}>
              <IconHistory size={20} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="View Schema">
            <ActionIcon variant="light" color={accent} onClick={openSchema}>
              <IconTable size={20} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Saved Queries">
            <ActionIcon variant="light" color={accent}>
              <IconBookmark size={20} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </div>

      <Collapse in={showHistory}>
        <Paper className={classes.historyPanel} withBorder>
          <ScrollArea h={150}>
            {recentQueries.map((item) => (
              <button
                type="button"
                key={item.natural}
                className={classes.historyItem}
                onClick={() => loadHistoryItem(item.natural)}
              >
                <div>
                  <Text size="sm" fw={500}>
                    {item.natural}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {item.sql}
                  </Text>
                </div>
                <IconChevronRight size={16} className={classes.historyArrow} />
              </button>
            ))}
          </ScrollArea>
        </Paper>
      </Collapse>

      <Paper className={classes.querySection} withBorder>
        <div className={classes.inputGroup}>
          <div className={classes.inputWrapper}>
            <IconTerminal2 size={20} className={classes.inputIcon} />
            <TextInput
              placeholder="Describe what you want to know about the wells data..."
              value={naturalQuery}
              onChange={(event) => setNaturalQuery(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleProcessNaturalLanguage();
                }
              }}
              className={classes.queryInput}
            />
          </div>
          <Button
            color={brand.playground}
            size="md"
            loading={isProcessingNL}
            onClick={handleProcessNaturalLanguage}
            disabled={!naturalQuery.trim()}
            className={classes.generateButton}
          >
            Generate SQL
          </Button>
        </div>

        <Collapse in={!!generatedSQL}>
          <div className={classes.sqlContainer}>
            <Grid>
              <Grid.Col span={{ base: 12, md: 7 }}>
                <div className={classes.sqlHeader}>
                  <Text size="sm" fw={500} c="dimmed">
                    Generated SQL:
                  </Text>
                  <Tooltip label="Copy SQL">
                    <ActionIcon variant="subtle" color={accent} onClick={copySQL}>
                      <IconCode size={16} />
                    </ActionIcon>
                  </Tooltip>
                </div>
                <Code block className={classes.sqlPreview}>
                  {generatedSQL}
                </Code>
                <Button
                  variant="light"
                  color={accent}
                  size="sm"
                  mt="md"
                  loading={isExecutingSQL}
                  onClick={handleExecuteSQL}
                  fullWidth
                >
                  Execute SQL Query
                </Button>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 5 }}>
                <ScrollArea className={classes.explanationScroll} scrollbarSize={6}>
                  <Text size="sm" fw={500} mb="xs">
                    From Natural Language to SQL:
                  </Text>
                  {explanation.reasoning.map((reason) => (
                    <Text key={reason} size="sm" c="dimmed" mb="xs">
                      {reason}
                    </Text>
                  ))}

                  <Text size="sm" fw={500} mt="md" mb="xs">
                    Query Breakdown:
                  </Text>
                  {explanation.sqlBreakdown.map((part) => (
                    <div key={part.part} className={classes.sqlPart}>
                      <Code className={classes.sqlPartCode}>{part.part}</Code>
                      <Text size="sm" c="dimmed">
                        {part.explanation}
                      </Text>
                    </div>
                  ))}

                  <Text size="sm" fw={500} mt="md" mb="xs">
                    Key Concepts Used:
                  </Text>
                  <ul className={classes.conceptList}>
                    {explanation.concepts.map((concept) => (
                      <li key={concept}>
                        <Text size="sm" c="dimmed">
                          {concept}
                        </Text>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </Grid.Col>
            </Grid>
          </div>
        </Collapse>
      </Paper>

      <Collapse in={!!results}>
        <Grid gutter="md" mt="md">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <ResultsPanel rows={results ?? []} columns={resultColumns} />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card className={classes.explanationPanel} withBorder>
              <Text fw={500} size="sm" mb="md">
                Query Results Explained
              </Text>
              <Text size="sm" c="dimmed" mb="md">
                Found {results?.length} wells with elevated iron content ({'>'}0.3 mg/L) in their chemical
                analysis from the past year.
              </Text>
              <ul className={classes.explanationList}>
                <li>Iron levels above 0.3 mg/L may indicate water quality concerns</li>
                <li>Results are ordered by sample date to show most recent first</li>
                <li>Coordinates can be used for spatial analysis</li>
              </ul>
            </Card>
          </Grid.Col>
        </Grid>
      </Collapse>

      <SchemaViewer opened={isOpen} onClose={closeSchema} />
    </Container>
  );
}
