import React, { useEffect, useState } from 'react';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router-dom';
import { pollService } from '../services/api';

const Home = () => {
    const [polls, setPolls] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPolls = async () => {
            try {
                const data = await pollService.getPolls();
                setPolls(data);
            } catch (error) {
                console.error('Error fetching polls:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPolls();
    }, []);

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container sx={{ mt: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Active Polls
            </Typography>
            <Grid container spacing={3}>
                {polls.map((poll) => (
                    <Grid item xs={12} sm={6} md={4} key={poll.id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" component="h2">
                                    {poll.title}
                                </Typography>
                                <Typography color="textSecondary" sx={{ mb: 2 }}>
                                    {poll.description}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Options: {poll.options.length}
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    sx={{ mt: 2 }}
                                    onClick={() => navigate(`/polls/${poll.id}`)}
                                >
                                    View Poll
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default Home; 