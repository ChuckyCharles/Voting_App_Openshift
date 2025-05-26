import React, { useEffect, useState } from 'react';
import {
    Container,
    Paper,
    Typography,
    Button,
    Box,
    CircularProgress,
    Alert,
    RadioGroup,
    FormControlLabel,
    Radio,
    LinearProgress,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { Poll, PollOption } from '../types';
import { pollService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const PollDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [poll, setPoll] = useState<Poll | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [results, setResults] = useState<PollOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [voting, setVoting] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const fetchPoll = async () => {
            try {
                const pollData = await pollService.getPoll(Number(id));
                setPoll(pollData);
                const resultsData = await pollService.getResults(Number(id));
                setResults(resultsData);
            } catch (err) {
                setError('Failed to load poll details');
            } finally {
                setLoading(false);
            }
        };

        fetchPoll();
    }, [id]);

    const handleVote = async () => {
        if (!selectedOption) return;

        setVoting(true);
        try {
            await pollService.vote(Number(id), selectedOption);
            const resultsData = await pollService.getResults(Number(id));
            setResults(resultsData);
            setSelectedOption(null);
        } catch (err) {
            setError('Failed to submit vote');
        } finally {
            setVoting(false);
        }
    };

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!poll) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert severity="error">Poll not found</Alert>
            </Container>
        );
    }

    const totalVotes = results.reduce((sum, option) => sum + (option.votes || 0), 0);

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    {poll.title}
                </Typography>
                <Typography color="textSecondary" paragraph>
                    {poll.description}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                    End Date: {new Date(poll.end_date).toLocaleString()}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {user ? (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Cast Your Vote
                        </Typography>
                        <RadioGroup
                            value={selectedOption}
                            onChange={(e) => setSelectedOption(Number(e.target.value))}
                        >
                            {poll.options.map((option) => (
                                <FormControlLabel
                                    key={option.id}
                                    value={option.id}
                                    control={<Radio />}
                                    label={option.text}
                                />
                            ))}
                        </RadioGroup>
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={!selectedOption || voting}
                            onClick={handleVote}
                            sx={{ mt: 2 }}
                        >
                            {voting ? 'Submitting Vote...' : 'Submit Vote'}
                        </Button>
                    </Box>
                ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Please log in to vote
                    </Alert>
                )}

                <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        Results
                    </Typography>
                    {results.map((option) => {
                        const percentage = totalVotes > 0
                            ? ((option.votes || 0) / totalVotes) * 100
                            : 0;
                        return (
                            <Box key={option.id} sx={{ mb: 2 }}>
                                <Typography variant="body1">
                                    {option.text}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{ width: '100%', mr: 1 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={percentage}
                                            sx={{ height: 10, borderRadius: 5 }}
                                        />
                                    </Box>
                                    <Box sx={{ minWidth: 35 }}>
                                        <Typography variant="body2" color="textSecondary">
                                            {`${Math.round(percentage)}%`}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography variant="body2" color="textSecondary">
                                    {option.votes || 0} votes
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            </Paper>
        </Container>
    );
};

export default PollDetails; 