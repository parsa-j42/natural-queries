import type { ReactNode } from 'react';
import { ActionIcon, Badge, Group, Paper, ScrollArea, Table, Text } from '@mantine/core';
import { IconCircleCheck, IconX } from '@tabler/icons-react';
import classes from './ResultsPanel.module.css';

export interface ResultsColumn<T> {
  key: string;
  header: string;
  // Custom cell renderer. Falls back to the row value at `key` when omitted.
  render?: (row: T) => ReactNode;
}

interface ResultsPanelProps<T> {
  rows: T[];
  columns: ResultsColumn<T>[];
  title?: string;
  // Scroll area height. Leave undefined to let the table grow with its content.
  height?: number | string;
  // When provided, renders a close button in the header.
  onClose?: () => void;
}

// Shared query-results table used by both Playground and Story modes.
export function ResultsPanel<T>({
  rows,
  columns,
  title = 'Query Results',
  height,
  onClose,
}: ResultsPanelProps<T>) {
  return (
    <Paper withBorder className={classes.panel}>
      <div className={classes.header}>
        <Text fw={500} size="sm">
          {title}
        </Text>
        <Group gap="xs" wrap="nowrap">
          <Badge variant="light" color="teal" leftSection={<IconCircleCheck size={12} />}>
            {rows.length} Records Found
          </Badge>
          {onClose && (
            <ActionIcon variant="subtle" size="sm" onClick={onClose} aria-label="Hide results">
              <IconX size={16} />
            </ActionIcon>
          )}
        </Group>
      </div>
      <ScrollArea h={height}>
        <Table>
          <Table.Thead>
            <Table.Tr>
              {columns.map((column) => (
                <Table.Th key={column.key}>{column.header}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row, rowIndex) => (
              <Table.Tr key={rowIndex}>
                {columns.map((column) => (
                  <Table.Td key={column.key}>
                    {column.render
                      ? column.render(row)
                      : ((row[column.key as keyof T] as ReactNode) ?? 'NULL')}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Paper>
  );
}
