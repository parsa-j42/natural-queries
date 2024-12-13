import { Container, Title, SimpleGrid, Card, Text, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import classes from './Welcome.module.css';

export function Welcome() {
  const navigate = useNavigate();

  return (
    <>
      <Container size="lg" py="xl">
        <Title order={1} className={classes.title} ta="center" mt={30} mb={80}>
          Welcome to{' '}
          <Text inherit variant="gradient" component="span" gradient={{ from: '#a3be8c', to: '#b48ead' }}>
            Natural Queries
          </Text>
        </Title>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            className={`${classes.card} ${classes.playgroundCard}`}
          >
            <Title order={2} mb="md" c="#a3be8c">Playground Mode</Title>
            <Text mb="md">Explore and experiment with:</Text>
            <ul>
              <li>Free Exploration</li>
              <li>Natural Query Interface</li>
              <li>Real-time Feedback</li>
              <li>Advanced Features</li>
            </ul>
            <Button onClick={() => navigate('/playground')} fullWidth mt="md" radius="md" color="#a3be8c">
              Start Exploring
            </Button>
          </Card>

          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            className={`${classes.card} ${classes.storyCard}`}
          >
            <Title order={2} mb="md" c="#b48ead">Story Mode</Title>
            <Text mb="md">Begin your learning journey with:</Text>
            <ul>
              <li>Structured Learning Path</li>
              <li>Guided Tutorials</li>
              <li>Progressive Complexity</li>
              <li>Achievement System</li>
            </ul>
            <Button onClick={() => navigate('/story')} fullWidth mt="md" radius="md" color="#b48ead">
              Start Learning
            </Button>
          </Card>
        </SimpleGrid>
      </Container>
    </>
  );
}