import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
    categories: { category: string; weaknesses: number }[];
}

const CategoryPieChart: React.FC<Props> = ({ categories }) => {

    const totalWeaknesses = categories.reduce((sum, category) => sum + category.weaknesses, 0);

    const data = {
        labels: categories.map(c => c.category),
        datasets: [
            {
                label: 'חולשות לפי קטגוריה',
                data: categories.map(c => c.weaknesses),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
                    '#E74C3C', '#8E44AD', '#3498DB', '#1ABC9C', '#2ECC71', '#F39C12', '#D35400'
                ],
                hoverBackgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
                    '#E74C3C', '#8E44AD', '#3498DB', '#1ABC9C', '#2ECC71', '#F39C12', '#D35400'
                ],
            },
        ],
    };

    // Options for the pie chart
    const options = {
        plugins: {
            tooltip: {
                callbacks: {
                    label: function (tooltipItem: any) {
                        const value = tooltipItem.raw;
                        const percentage = ((value / totalWeaknesses) * 100).toFixed(2);
                        return `${percentage}%`;
                    }
                }
            }
        },
        maintainAspectRatio: false,
    };

    return (
        <div style={{ textAlign: 'center', height: '500px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <h2>ניתוח חולשות</h2>
            <div style={{ width: '400px', height: '400px', marginBottom: '30px' }}>
                <Pie data={data} options={options} />
            </div>
        </div>
    );
};

export default CategoryPieChart;
