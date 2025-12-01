import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getRoomDetails } from '../services/roomService';
import ProblemDetail from './ProblemDetail';

const RoomProblem = () => {
    const { roomId } = useParams();
    const [problemId, setProblemId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoomProblem = async () => {
            try {
                const { data } = await getRoomDetails(roomId);
                if (data && data.problem_id) {
                    setProblemId(data.problem_id);
                }
            } catch (error) {
                console.error('Failed to fetch room details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRoomProblem();
    }, [roomId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-primary flex items-center justify-center">
                <div className="text-primary-400 text-xl">Loading room problem...</div>
            </div>
        );
    }

    if (!problemId) {
        return (
            <div className="min-h-screen bg-dark-primary flex items-center justify-center">
                <div className="text-red-400 text-xl">Problem not found in this room</div>
            </div>
        );
    }

    return <ProblemDetail problemIdProp={problemId} />;
};

export default RoomProblem;
