import { Button, Card, Container, List, SimpleGrid, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { brand } from '@/theme/colors';
import classes from './Welcome.module.css';

// Landing cards are data-driven so the two modes stay visually consistent.
const modes = [
  {
    to: '/playground',
    title: 'Playground Mode',
    color: brand.playground,
    cardClass: classes.playgroundCard,
    intro: 'Explore and experiment with:',
    points: ['Free Exploration', 'Natural Query Interface', 'Real-time Feedback', 'Advanced Features'],
    cta: 'Start Exploring',
  },
  {
    to: '/story',
    title: 'Story Mode',
    color: brand.story,
    cardClass: classes.storyCard,
    intro: 'Begin your learning journey with:',
    points: ['Structured Learning Path', 'Guided Tutorials', 'Progressive Complexity', 'Achievement System'],
    cta: 'Start Learning',
  },
];

export function Welcome() {
  const navigate = useNavigate();

  return (
    <Container size="lg" py="xl">
      <Title
        order={1}
        className={classes.title}
        ta="center"
        mt={{ base: 8, sm: 30 }}
        mb={{ base: 40, sm: 80 }}
      >
        Welcome to{' '}
        <Text inherit variant="gradient" component="span" gradient={{ from: brand.playground, to: brand.story }}>
          Natural Queries
        </Text>
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
        {modes.map((mode) => (
          <Card
            key={mode.to}
            shadow="sm"
            padding="lg"
            radius="md"
            className={`${classes.card} ${mode.cardClass}`}
            onClick={() => navigate(mode.to)}
          >
            <Title order={2} mb="md" c={mode.color}>
              {mode.title}
            </Title>
            <Text mb="md">{mode.intro}</Text>
            <List mb="md">
              {mode.points.map((point) => (
                <List.Item key={point}>{point}</List.Item>
              ))}
            </List>
            <Button onClick={() => navigate(mode.to)} fullWidth mt="auto" radius="md" color={mode.color}>
              {mode.cta}
            </Button>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}
