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
  ScrollArea,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { ResultsColumn, ResultsPanel } from '@/components/Results/ResultsPanel';
import { useSchemaViewer } from '@/contexts/SchemaContext';
import { QueryResult, runQuery, warmUp } from '@/db/duckdb';
import { formatCell } from '@/db/format';
import { brand } from '@/theme/colors';
import { useAccentColor } from '@/theme/useAccentColor';
import SchemaViewer from '../components/SchemaViewer/SchemaViewer';
import { generateExplanation, generateSQL, recentQueries } from './PlaygroundMode.mocks';
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

  const accent = useAccentColor();
  const clipboard = useClipboard();

  // Warm up the wasm engine on mount so the first query does not pay for the
  // download and view setup.
  useEffect(() => {
    warmUp();
  }, []);

  // Explanation only depends on the natural-language query, so memoize it instead of
  // recomputing on every render.
  const explanation = useMemo(() => generateExplanation(naturalQuery), [naturalQuery]);
  const hasExplanation = explanation.reasoning.length > 0;

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

    setIsProcessingNL(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const sql = generateSQL(naturalQuery);
      if (!sql) {
        notifications.show({
          title: 'Not wired up yet',
          message:
            'Only the iron-content example generates SQL for now. You can still write SQL by hand and run it.',
          color: 'yellow',
        });
        return;
      }
      setGeneratedSQL(sql);
      setResults(null);
      setQueryError(null);
      notifications.show({
        title: 'Query Generated',
        message: 'SQL query is ready to execute',
        color: 'teal',
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

            {hasExplanation && (
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
