import { useEffect, useMemo, useState } from 'react';
import {
  IconAlertTriangle,
  IconBookmark,
  IconChevronRight,
  IconCode,
  IconHistory,
  IconTable,
  IconTerminal2,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Alert,
  Button,
  Card,
  Code,
  Collapse,
  Container,
  Grid,
  Group,
  Paper,
  PasswordInput,
  ScrollArea,
  Select,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  fetchProviders,
  generateQuery,
  type ModelInfo,
  type QueryExplanation,
} from '@/API/client';
import { ResultsColumn, ResultsPanel } from '@/components/Results/ResultsPanel';
import { useSchemaViewer } from '@/contexts/SchemaContext';
import { QueryResult, runQuery, warmUp } from '@/db/duckdb';
import { formatCell } from '@/db/format';
import { brand } from '@/theme/colors';
import { useAccentColor } from '@/theme/useAccentColor';
import SchemaViewer from '../components/SchemaViewer/SchemaViewer';
import { recentQueries } from './PlaygroundMode.mocks';
import classes from './PlaygroundMode.module.css';

type ResultRow = Record<string, unknown>;

export function PlaygroundMode() {
  const { isOpen, openSchema, closeSchema } = useSchemaViewer();

  const [naturalQuery, setNaturalQuery] = useState('');
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [results, setResults] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isProcessingNL, setIsProcessingNL] = useState(false);
  const [isExecutingSQL, setIsExecutingSQL] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [explanation, setExplanation] = useState<QueryExplanation | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');

  const accent = useAccentColor();
  const clipboard = useClipboard();

  // Warm up the wasm engine on mount, and load the model list so the picker can
  // default to whatever the backend recommends.
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
          message: 'Could not reach the generation service. You can still run SQL by hand.',
          color: 'yellow',
        });
      });
  }, []);

  const selectedModelInfo = useMemo(
    () => models.find((model) => model.id === selectedModel) ?? null,
    [models, selectedModel]
  );
  const needsKey = selectedModelInfo?.byok_only ?? false;
  const hasExplanation =
    !!explanation &&
    explanation.reasoning.length + explanation.sqlBreakdown.length + explanation.concepts.length >
      0;

  // Model picker options, grouped by provider.
  const modelOptions = useMemo(() => {
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
  }, [models]);

  // Columns come straight from whatever the query returned, so any SQL renders.
  const resultColumns = useMemo<ResultsColumn<ResultRow>[]>(
    () =>
      (results?.columns ?? []).map((column) => ({
        key: column.name,
        header: column.name,
        render: (row) => formatCell(row[column.name], column.type),
      })),
    [results]
  );

  const handleProcessNaturalLanguage = async () => {
    if (!naturalQuery.trim()) {
      notifications.show({
        title: 'Empty Query',
        message: 'Please enter your question first',
        color: 'yellow',
      });
      return;
    }

    if (needsKey && !apiKey.trim()) {
      notifications.show({
        title: 'API key required',
        message: `${selectedModelInfo?.label} needs your own API key. Enter it to continue.`,
        color: 'yellow',
      });
      return;
    }

    setIsProcessingNL(true);
    setGenerationError(null);
    try {
      const result = await generateQuery({
        question: naturalQuery,
        model: selectedModel ?? undefined,
        apiKey: needsKey ? apiKey.trim() : undefined,
      });
      setGeneratedSQL(result.sql);
      setExplanation(result.explanation);
      setResults(null);
      setQueryError(null);
      notifications.show({
        title: 'Query Generated',
        message: `SQL ready (via ${result.provider}). Review and execute it below.`,
        color: 'teal',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setGenerationError(message);
      notifications.show({
        title: 'Generation failed',
        message: 'See the details above the editor.',
        color: 'red',
      });
    } finally {
      setIsProcessingNL(false);
    }
  };

  const handleExecuteSQL = async () => {
    if (!generatedSQL.trim()) {
      notifications.show({
        title: 'No SQL Query',
        message: 'Write or generate a SQL query first',
        color: 'yellow',
      });
      return;
    }

    setIsExecutingSQL(true);
    setQueryError(null);
    try {
      const result = await runQuery(generatedSQL);
      setResults(result);
      notifications.show({
        title: 'Query Executed',
        message: `${result.rows.length} row${result.rows.length === 1 ? '' : 's'} returned`,
        color: 'teal',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setResults(null);
      setQueryError(message);
      notifications.show({
        title: 'Execution Failed',
        message: 'The query could not run. See the editor for details.',
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
    setQueryError(null);
    setExplanation(null);
    setGenerationError(null);
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
            <ActionIcon
              variant="light"
              color={accent}
              onClick={() => setShowHistory((prev) => !prev)}
            >
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

        <Group mt="sm" gap="sm" align="flex-end" wrap="wrap">
          <Select
            label="Model"
            data={modelOptions}
            value={selectedModel}
            onChange={setSelectedModel}
            searchable
            allowDeselect={false}
            disabled={models.length === 0}
            size="sm"
            w={240}
          />
          {needsKey && (
            <PasswordInput
              label={`${selectedModelInfo?.label} API key`}
              placeholder="Used only for this request"
              value={apiKey}
              onChange={(event) => setApiKey(event.currentTarget.value)}
              size="sm"
              w={280}
            />
          )}
          {selectedModelInfo?.notes && (
            <Text size="xs" c="dimmed" style={{ maxWidth: 360 }}>
              {selectedModelInfo.notes}
            </Text>
          )}
        </Group>

        {generationError && (
          <Alert
            mt="sm"
            color="red"
            variant="light"
            icon={<IconAlertTriangle size={16} />}
            title="Could not generate SQL"
          >
            <Text size="sm" className={classes.errorText}>
              {generationError}
            </Text>
          </Alert>
        )}

        <div className={classes.sqlContainer}>
          <Grid>
            <Grid.Col span={{ base: 12, md: hasExplanation ? 7 : 12 }}>
              <div className={classes.sqlHeader}>
                <Text size="sm" fw={500} c="dimmed">
                  SQL query (editable):
                </Text>
                <Tooltip label="Copy SQL">
                  <ActionIcon variant="subtle" color={accent} onClick={copySQL}>
                    <IconCode size={16} />
                  </ActionIcon>
                </Tooltip>
              </div>
              <Textarea
                value={generatedSQL}
                onChange={(event) => setGeneratedSQL(event.currentTarget.value)}
                placeholder="Write SQL here, or generate it from a question above. Example: SELECT count(*) FROM Wells;"
                autosize
                minRows={6}
                maxRows={16}
                spellCheck={false}
                classNames={{ input: classes.sqlEditor }}
              />
              {queryError && (
                <Alert
                  mt="sm"
                  color="red"
                  variant="light"
                  icon={<IconAlertTriangle size={16} />}
                  title="Query error"
                >
                  <Text size="sm" className={classes.errorText}>
                    {queryError}
                  </Text>
                </Alert>
              )}
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

            {hasExplanation && explanation && (
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
            )}
          </Grid>
        </div>
      </Paper>

      <Collapse in={!!results}>
        <Grid gutter="md" mt="md">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <ResultsPanel rows={results?.rows ?? []} columns={resultColumns} height={420} />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card className={classes.explanationPanel} withBorder>
              <Text fw={500} size="sm" mb="md">
                Query Results
              </Text>
              <Text size="sm" c="dimmed" mb="md">
                Returned {results?.rows.length ?? 0} row
                {results?.rows.length === 1 ? '' : 's'} across {results?.columns.length ?? 0} column
                {results?.columns.length === 1 ? '' : 's'}.
              </Text>
              <ul className={classes.explanationList}>
                <li>Executed locally in your browser with DuckDB-WASM</li>
                <li>Only the columns and rows the query needs are fetched</li>
                <li>Edit the SQL above and run again to explore further</li>
              </ul>
            </Card>
          </Grid.Col>
        </Grid>
      </Collapse>

      <SchemaViewer opened={isOpen} onClose={closeSchema} />
    </Container>
  );
}
