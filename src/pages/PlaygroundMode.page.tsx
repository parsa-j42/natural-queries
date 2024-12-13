import { useState } from 'react';
import {
  Container,
  Title,
  TextInput,
  Button,
  Text,
  useMantineColorScheme,
  Code,
  Paper,
  ScrollArea,
  Tooltip,
  ActionIcon,
  Collapse,
  Badge,
  Table,
  Grid,
  Card,
  Group,
} from '@mantine/core';
import {
  IconTerminal2,
  IconCode,
  IconHistory,
  IconBookmark,
  IconChevronRight,
  IconTable,
  IconCircleCheck,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useClipboard } from '@mantine/hooks';
import classes from './PlaygroundMode.module.css';
import SchemaViewer from '../components/SchemaViewer/SchemaViewer';
import { useSchemaViewer } from '@/contexts/SchemaContext';

interface WellResult {
  Well_ID: number;
  Chemical_Analysis_ID: number;
  Sample_Date: string;
  Value: number;
  Element_Name: string;
  Latitude: number;
  Longitude: number;
}

export function PlaygroundMode() {
  // Schema Viewer
  const { isOpen, openSchema, closeSchema } = useSchemaViewer();

  // Core states
  const [naturalQuery, setNaturalQuery] = useState('');
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [results, setResults] = useState<WellResult[] | null>(null);
  // Processing states
  const [isProcessingNL, setIsProcessingNL] = useState(false);
  const [isExecutingSQL, setIsExecutingSQL] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Theme and utilities
  const { colorScheme } = useMantineColorScheme();
  const clipboard = useClipboard();

  // Example data
  const recentQueries = [
    {
      natural: "Show me wells with high iron content in the last year",
      sql: "SELECT W.Well_ID, CA.Sample_Date, AI.Value FROM Wells W JOIN Chemical_Analysis CA..."
    },
    {
      natural: "Find wells with recent chemical analyses in Calgary",
      sql: "SELECT W.Well_ID, CA.Sample_Date FROM Wells W JOIN Chemical_Analysis CA..."
    }
  ];

  // Helper to generate SQL based on natural language
  const generateSQL = (query: string) => {
    // This would be AI-generated, but for demo we'll handle a specific case
    if (query.toLowerCase().includes('iron content')) {
      return `
SELECT 
  W.Well_ID,
  W.Latitude,
  W.Longitude,
  CA.Chemical_Analysis_ID,
  CA.Sample_Date,
  AI.Value,
  AI.Element_Name
FROM Wells W
JOIN Chemical_Analysis CA ON W.Well_ID = CA.Well_ID
JOIN Analysis_Items AI ON CA.Chemical_Analysis_ID = AI.Chemical_Analysis_ID
WHERE 
  AI.Element_Name = 'Iron'
  AND AI.Value > 0.3  -- Standard threshold for iron content
  AND CA.Sample_Date >= DATEADD(year, -1, GETDATE())
ORDER BY 
  CA.Sample_Date DESC;`.trim();
    }
    return '';
  };

// Domain-specific explanation generator
  const generateExplanation = (natural: string, _sql: string) => {
    if (natural.toLowerCase().includes('iron content')) {
      return {
        translation: {
          from: natural,
          reasoning: [
            "We'll need to join three tables to get this information:",
            "1. Wells table for location data",
            "2. Chemical_Analysis table for sample dates",
            "3. Analysis_Items table for iron measurements"
          ]
        },
        sqlBreakdown: [
          {
            part: 'SELECT W.Well_ID, W.Latitude, W.Longitude, ...',
            explanation: 'Getting well location and identification data'
          },
          {
            part: 'JOIN Chemical_Analysis CA ON W.Well_ID = CA.Well_ID',
            explanation: 'Connecting wells to their chemical analyses using Well_ID'
          },
          {
            part: 'JOIN Analysis_Items AI ON CA.Chemical_Analysis_ID = AI.Chemical_Analysis_ID',
            explanation: 'Connecting to specific chemical measurements using Chemical_Analysis_ID'
          },
          {
            part: "WHERE AI.Element_Name = 'Iron' AND AI.Value > 0.3",
            explanation: 'Filtering for iron content above the standard threshold (0.3 mg/L)'
          }
        ],
        concepts: [
          'Multi-table JOIN operations',
          'Date-based filtering',
          'Chemical analysis thresholds',
          'Result ordering by date'
        ]
      };
    }
    return {
      translation: { from: '', reasoning: [] },
      sqlBreakdown: [],
      concepts: []
    };
  };

  const getMockResults = (query: string): WellResult[] => {
    if (query.toLowerCase().includes('iron content')) {
      return [
        {
          Well_ID: 1001,
          Chemical_Analysis_ID: 5001,
          Sample_Date: '2023-10-15',
          Value: 0.45,
          Element_Name: 'Iron',
          Latitude: 51.0447,
          Longitude: -114.0719
        },
        {
          Well_ID: 1002,
          Chemical_Analysis_ID: 5002,
          Sample_Date: '2023-09-20',
          Value: 0.52,
          Element_Name: 'Iron',
          Latitude: 51.0544,
          Longitude: -114.0667
        }
      ];
    }
    return [];
  };

  // Handlers for processing and executing queries
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      const sql = generateSQL(naturalQuery);
      setGeneratedSQL(sql);
      setResults(null);

      notifications.show({
        title: 'Query Generated',
        message: 'SQL query is ready to execute',
        color: 'teal',
      });
    } catch (error) {
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockResults = getMockResults(naturalQuery);
      setResults(mockResults);

      notifications.show({
        title: 'Query Executed',
        message: 'Results are ready!',
        color: 'teal',
      });
    } catch (error) {
      notifications.show({
        title: 'Execution Failed',
        message: 'Could not execute SQL query',
        color: 'red',
      });
    } finally {
      setIsExecutingSQL(false);
    }
  };

  return (
    <Container size="xl" py="xs">
      {/* Header */}
      <div className={classes.header}>
        <Title order={2} className={classes.title}>
          <Text
            inherit
            component="span"
            c="#a3be8c"
          >
            SQL Playground
          </Text>
        </Title>

        <div className={classes.actions}>
          <Tooltip label="Query History">
            <ActionIcon
              variant="light"
              onClick={() => setShowHistory(!showHistory)}
              color={colorScheme === 'dark' ? '#d08770' : '#5e81ac'}
            >
              <IconHistory size={20} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="View Schema">
            <ActionIcon
              variant="light"
              onClick={openSchema}
              color={colorScheme === 'dark' ? '#d08770' : '#5e81ac'}
            >
              <IconTable size={20} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Saved Queries">
            <ActionIcon
              variant="light"
              color={colorScheme === 'dark' ? '#d08770' : '#5e81ac'}
            >
              <IconBookmark size={20} />
            </ActionIcon>
          </Tooltip>
        </div>
      </div>

      {/* History Panel */}
      <Collapse in={showHistory}>
        <Paper className={classes.historyPanel} withBorder>
          <ScrollArea h={150}>
            {recentQueries.map((item, index) => (
              <button
                type="button"
                key={index}
                className={classes.historyItem}
                onClick={() => {
                  setNaturalQuery(item.natural);
                  setGeneratedSQL('');
                  setResults(null);
                }}
              >
                <div>
                  <Text size="sm" fw={500}>{item.natural}</Text>
                  <Text size="xs" c="dimmed">{item.sql}</Text>
                </div>
                <IconChevronRight size={16} className={classes.historyArrow} />
              </button>
            ))}
          </ScrollArea>
        </Paper>
      </Collapse>


      {/* Query Section */}
      <Paper className={classes.querySection} withBorder>
        {/* Natural Language Input */}
        <div className={classes.inputGroup}>
          <div className={classes.inputWrapper}>
            <IconTerminal2 size={20} className={classes.inputIcon} />
            <TextInput
              placeholder="Describe what you want to know about the wells data..."
              value={naturalQuery}
              onChange={(e) => setNaturalQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleProcessNaturalLanguage();
                }
              }}
              className={classes.queryInput}
            />
          </div>
          <Button
            color="#a3be8c"
            size="md"
            loading={isProcessingNL}
            onClick={handleProcessNaturalLanguage}
            disabled={!naturalQuery.trim()}
          >
            Generate SQL
          </Button>
        </div>

        {/* Generated SQL with Explanation */}
        <Collapse in={!!generatedSQL}>
          <div className={classes.sqlContainer}>
            <Grid>
              {/* SQL Panel */}
              <Grid.Col span={7}>
                <div className={classes.sqlHeader}>
                  <Text size="sm" fw={500} c="dimmed">Generated SQL:</Text>
                  <Group gap="xs">
                    <Tooltip label="Copy SQL">
                      <ActionIcon
                        variant="subtle"
                        color={colorScheme === 'dark' ? '#d08770' : '#5e81ac'}
                        onClick={() => {
                          clipboard.copy(generatedSQL);
                          notifications.show({
                            message: 'SQL copied to clipboard',
                            color: 'teal',
                          });
                        }}
                      >
                        <IconCode size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </div>
                <Code block className={classes.sqlPreview}>
                  {generatedSQL}
                </Code>
                <Button
                  variant="light"
                  color={colorScheme === 'dark' ? '#d08770' : '#5e81ac'}
                  size="sm"
                  mt="md"
                  loading={isExecutingSQL}
                  onClick={handleExecuteSQL}
                  fullWidth
                >
                  Execute SQL Query
                </Button>
              </Grid.Col>

              {/* Explanation Panel */}
              <Grid.Col span={5}>
                <ScrollArea h="31.5rem" className={classes.explanationScroll} scrollbarSize={6}>
                  {/* Translation Explanation */}
                  <Text size="sm" fw={500} mb="xs">From Natural Language to SQL:</Text>
                  {generateExplanation(naturalQuery, generatedSQL).translation.reasoning.map((reason, idx) => (
                    <Text key={idx} size="sm" c="dimmed" mb="xs">
                      {reason}
                    </Text>
                  ))}

                  {/* SQL Breakdown */}
                  <Text size="sm" fw={500} mt="md" mb="xs">Query Breakdown:</Text>
                  {generateExplanation(naturalQuery, generatedSQL).sqlBreakdown.map((part, idx) => (
                    <div key={idx} className={classes.sqlPart}>
                      <Code className={classes.sqlPartCode}>
                        {part.part}
                      </Code>
                      <Text size="sm" c="dimmed">
                        {part.explanation}
                      </Text>
                    </div>
                  ))}

                  {/* Key Concepts */}
                  <Text size="sm" fw={500} mt="md" mb="xs">Key Concepts Used:</Text>
                  <ul className={classes.conceptList}>
                    {generateExplanation(naturalQuery, generatedSQL).concepts.map((concept, idx) => (
                      <li key={idx}>
                        <Text size="sm" c="dimmed">{concept}</Text>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </Grid.Col>
            </Grid>
          </div>
        </Collapse>
      </Paper>

      {/* Results + Explanation Grid */}
      <Collapse in={!!results}>
        <Grid gutter="md" mt="md">
          {/* Results Panel */}
          <Grid.Col span={8}>
            <Paper className={classes.resultsPanel} withBorder>
              <div className={classes.panelHeader}>
                <Text fw={500} size="sm">Query Results</Text>
                <Badge
                  variant="light"
                  color="teal"
                  leftSection={<IconCircleCheck size={12} />}
                >
                  {results?.length || 0} Records Found
                </Badge>
              </div>
              <ScrollArea>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Well ID</Table.Th>
                      <Table.Th>Sample Date</Table.Th>
                      <Table.Th>Iron Value</Table.Th>
                      <Table.Th>Location (Lat, Long)</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {results?.map((row) => (
                      <Table.Tr key={row.Well_ID}>
                        <Table.Td>{row.Well_ID}</Table.Td>
                        <Table.Td>{row.Sample_Date}</Table.Td>
                        <Table.Td>{row.Value} mg/L</Table.Td>
                        <Table.Td>{`${row.Latitude.toFixed(4)}, ${row.Longitude.toFixed(4)}`}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Paper>
          </Grid.Col>

          {/* Explanation Panel */}
          <Grid.Col span={4}>
            <Card className={classes.explanationPanel} withBorder>
              <Text fw={500} size="sm" mb="md">Query Results Explained</Text>
              <Text size="sm" c="dimmed" mb="md">
                Found {results?.length} wells with elevated iron content ({'>'}0.3 mg/L) in their chemical analysis from the past year.
              </Text>
              <ul className={classes.explanationList}>
                <li>Iron levels above 0.3 mg/L may indicate water quality concerns</li>
                <li>Results are ordered by sample date to show most recent first</li>
                <li>Coordinates can be used for spatial analysis</li>
              </ul>

              {/* Quick Actions */}
              {/*<Text fw={500} size="sm" mt="xl" mb="md">Try Next:</Text>*/}
              {/*<div className={classes.quickActions}>*/}
              {/*  <Button*/}
              {/*    variant="light"*/}
              {/*    size="xs"*/}
              {/*    fullWidth*/}
              {/*    color={colorScheme === 'dark' ? '#d08770' : '#5e81ac'}*/}
              {/*    onClick={() => {*/}
              {/*      setNaturalQuery('Show all chemical elements analyzed for these wells');*/}
              {/*      setGeneratedSQL('');*/}
              {/*      setResults(null);*/}
              {/*    }}*/}
              {/*  >*/}
              {/*    View all chemical elements for these wells*/}
              {/*  </Button>*/}
              {/*  <Button*/}
              {/*    variant="light"*/}
              {/*    size="xs"*/}
              {/*    fullWidth*/}
              {/*    color={colorScheme === 'dark' ? '#d08770' : '#5e81ac'}*/}
              {/*    onClick={() => {*/}
              {/*      setNaturalQuery('Show historical iron levels for these wells');*/}
              {/*      setGeneratedSQL('');*/}
              {/*      setResults(null);*/}
              {/*    }}*/}
              {/*  >*/}
              {/*    View historical iron trends*/}
              {/*  </Button>*/}
              {/*</div>*/}
            </Card>
          </Grid.Col>
        </Grid>
      </Collapse>
      <SchemaViewer opened={isOpen} onClose={closeSchema} />
    </Container>
  );
}