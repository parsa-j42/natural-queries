import React, { useCallback, useState } from 'react';
import {
  IconChevronDown,
  IconChevronRight,
  IconGitBranch,
  IconKey,
  IconSearch,
  IconTable,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Group,
  Input,
  Modal,
  Paper,
  ScrollArea,
  Tabs,
  Text,
  Tooltip,
  rem,
} from '@mantine/core';
import { schemaData, TableData } from './schemaData';
import ERDiagram from './ERDiagram';
import classes from './SchemaViewer.module.css';

interface TreeNodeProps {
  name: string;
  data: TableData;
  level?: number;
  expanded: Record<string, boolean>;
  onToggle: (name: string) => void;
  searchTerm: string;
}

interface SchemaViewerProps {
  opened: boolean;
  onClose: () => void;
}

const getFieldStats = (fields: Record<string, any>) => {
  const stats = {
    primaryKeys: 0,
    foreignKeys: 0,
    totalFields: Object.keys(fields).length
  };

  Object.entries(fields).forEach(([fieldName, fieldData]) => {
    if (fieldName.toLowerCase().includes('_id')) {
      if (fieldData.description.toLowerCase().includes('primary key')) {
        stats.primaryKeys++;
      } else {
        stats.foreignKeys++;
      }
    }
  });

  return stats;
};

const formatDataType = (type: string) => {
  const baseType = type.toLowerCase();
  switch (baseType) {
    case 'long_integer':
      return 'Integer';
    case 'numeric':
      return 'Number';
    case 'datetime':
      return 'DateTime';
    case 'boolean':
      return 'Boolean';
    case 'text':
      return 'String';
    default:
      return type;
  }
};

const TreeNode: React.FC<TreeNodeProps> = ({ name, data, level = 0, expanded, onToggle, searchTerm }) => {
  const indent = level * 16;
  const isExpandable = data.fields && Object.keys(data.fields).length > 0;
  const fieldStats = isExpandable ? getFieldStats(data.fields) : null;

  const isMatch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    data.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    Object.entries(data.fields).some(([fieldName, fieldData]) =>
      fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fieldData.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (searchTerm && !isMatch) {
    return null;
  }

  const handleKeyPress = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (isExpandable) {
        onToggle(name);
      }
    }
  }, [isExpandable, name, onToggle]);

  return (
    <div
      role="treeitem"
      aria-expanded={expanded[name]}
      aria-selected={false}
      aria-level={level + 1}
      className={classes.treeNode}
    >
      <div
        role="button"
        tabIndex={0}
        className={classes.nodeHeader}
        style={{ paddingLeft: `${indent + 12}px` }}
        onClick={() => isExpandable && onToggle(name)}
        onKeyDown={handleKeyPress}
      >
        <Group gap="sm" className="flex-1">
          {isExpandable && (
            <ActionIcon
              variant="subtle"
              color="blue"
              className={classes.expandButton}
            >
              {expanded[name] ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
            </ActionIcon>
          )}
          <div className="flex-1">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text size="sm" fw={600} className={classes.tableName}>
                  {name}
                </Text>
                <Text size="xs" c="dimmed" className="mt-1">
                  {data.description}
                </Text>
              </div>
              {fieldStats && (
                <Group gap="xs" wrap="nowrap" className={classes.tableStats}>
                  <Tooltip label="Total Fields">
                    <Badge size="sm" variant="light">
                      {fieldStats.totalFields} fields
                    </Badge>
                  </Tooltip>
                  {fieldStats.primaryKeys > 0 && (
                    <Tooltip label="Primary Keys">
                      <Badge size="sm" variant="light" color="green" leftSection={<IconKey size={12} />}>
                        {fieldStats.primaryKeys}
                      </Badge>
                    </Tooltip>
                  )}
                  {fieldStats.foreignKeys > 0 && (
                    <Tooltip label="Foreign Keys">
                      <Badge size="sm" variant="light" color="grape" leftSection={<IconKey size={12} />}>
                        {fieldStats.foreignKeys}
                      </Badge>
                    </Tooltip>
                  )}
                </Group>
              )}
            </Group>
          </div>
        </Group>
      </div>

      {expanded[name] && data.fields && (
        <div
          role="group"
          aria-label={`Fields of ${name}`}
          className={classes.nodeContent}
        >
          {Object.entries(data.fields).map(([fieldName, fieldData]) => (
            <div
              key={fieldName}
              role="treeitem"
              aria-level={level + 2}
              aria-selected={false}
              tabIndex={0}
              className={classes.fieldRow}
              style={{ paddingLeft: `${indent + 24}px` }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                }
              }}
            >
              <Group justify="space-between" align="flex-start">
                <div className="flex-1">
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" fw={500} className={classes.fieldName}>
                      {fieldName}
                    </Text>
                    <Badge
                      size="sm"
                      className={classes.fieldType}
                      variant="light"
                    >
                      {formatDataType(fieldData.type)}
                    </Badge>
                    {fieldName.toLowerCase().includes('_id') && (
                      <Badge
                        size="sm"
                        className={classes.keyBadge}
                        variant="light"
                        color={fieldData.description.toLowerCase().includes('primary key') ? 'green' : 'grape'}
                      >
                        {fieldData.description.toLowerCase().includes('primary key') ? 'Primary Key' : 'Foreign Key'}
                      </Badge>
                    )}
                  </Group>
                  <Text size="xs" className={classes.fieldDescription}>
                    {fieldData.description}
                  </Text>
                </div>
              </Group>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SchemaViewer: React.FC<SchemaViewerProps> = ({ opened, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>('browser');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const toggleNode = useCallback((nodeName: string) => {
    setExpanded((prev) => ({
      ...prev,
      [nodeName]: !prev[nodeName],
    }));
  }, []);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="90%"
      radius="md"
      padding="lg"
      classNames={{
        inner: classes.modalInner,
        content: classes.modalContent,
        header: classes.modalHeader,
        body: classes.modalBody,
      }}
      styles={{
        content: {
          height: '90vh',
        },
      }}
      title={
        <Group>
          <IconTable style={{ width: rem(20) }} className={classes.titleIcon} />
          <Text fw={700}>Database Schema Explorer</Text>
        </Group>
      }
    >
      <Tabs
        value={activeTab}
        onChange={(value: string | null) => setActiveTab(value || 'browser')}
        className={classes.tabs}
      >
        <Tabs.List>
          <Tabs.Tab value="browser" leftSection={<IconTable size={16} />}>
            Schema Browser
          </Tabs.Tab>
          <Tabs.Tab value="erd" leftSection={<IconGitBranch size={16} />}>
            Entity Relationship Diagram
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="browser" className={classes.tabPanel}>
          <Input
            placeholder="Search tables and fields..."
            leftSection={<IconSearch style={{ width: rem(16) }} />}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
            className={classes.searchInput}
          />
          <Paper withBorder className={classes.contentPaper}>
            <ScrollArea className={classes.scrollArea}>
              <div role="tree" aria-label="Database Schema">
                {Object.entries(schemaData.tables).map(([tableName, tableData]) => (
                  <TreeNode
                    key={tableName}
                    name={tableName}
                    data={tableData}
                    expanded={expanded}
                    onToggle={toggleNode}
                    searchTerm={searchTerm}
                  />
                ))}
              </div>
            </ScrollArea>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="erd" className={classes.tabPanel}>
          <Paper withBorder className={classes.contentPaper}>
            <ERDiagram />
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
};

export default SchemaViewer;