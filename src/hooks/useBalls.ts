import { useState, useEffect } from 'react';
import { BowlingBall } from '../types';
import { mockBalls } from '../data/mockData';

export const useBalls = () => {
    const [balls, setBalls] = useState<BowlingBall[]>([]);
    const [loading, setLoading] = useState(true);
    const [error] = useState<string | null>(null);

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setBalls(mockBalls);
            setLoading(false);
        }, 500);
    }, []);

    const addBall = (ball: Omit<BowlingBall, 'id'>) => {
        const newBall: BowlingBall = {
            ...ball,
            id: Date.now().toString()
        };
        setBalls(prev => [...prev, newBall]);
        return newBall;
    };

    const updateBall = (id: string, updates: Partial<BowlingBall>) => {
        setBalls(prev =>
            prev.map(ball =>
                ball.id === id ? { ...ball, ...updates } : ball
            )
        );
    };

    const deleteBall = (id: string) => {
        setBalls(prev => prev.filter(ball => ball.id !== id));
    };

    const getBallById = (id: string) => {
        return balls.find(ball => ball.id === id);
    };

    const getBallsByCustomer = (customerId: string) => {
        return balls.filter(ball => ball.customerID === customerId);
    };

    const getBallsByStatus = (status: BowlingBall['status']) => {
        return balls.filter(ball => ball.status === status);
    };

    const getBallsByManufacturer = (manufacturer: string) => {
        return balls.filter(ball =>
            ball.manufacturer.toLowerCase().includes(manufacturer.toLowerCase())
        );
    };

    return {
        balls,
        loading,
        error,
        addBall,
        updateBall,
        deleteBall,
        getBallById,
        getBallsByCustomer,
        getBallsByStatus,
        getBallsByManufacturer
    };
};