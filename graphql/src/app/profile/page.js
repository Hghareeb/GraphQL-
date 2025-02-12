'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { gql, useQuery, ApolloClient, InMemoryCache } from '@apollo/client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import dynamic from 'next/dynamic';

const client = new ApolloClient({
  uri: 'https://learn.reboot01.com/api/graphql-engine/v1/graphql',
  cache: new InMemoryCache(),
  headers: {
    'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`
  }
});

const GET_USER_DATA = gql`
  query($userId: Int!, $eventId: Int!) {
    user(where: {id: {_eq: $userId}}) {
      id
      login
      firstName
      lastName
      email
      auditRatio
      totalUp
      totalDown
      campus
      xp_transactions: transactions(
        where: { 
          userId: { _eq: $userId },
          type: { _eq: "xp" },
          eventId: { _eq: $eventId }
        },
        order_by: { createdAt: desc }
      ) {
        id
        amount
        createdAt
        path
        object {
          id
          name
          type
        }
      }
      audits: audits_aggregate(
        where: {
          auditorId: {_eq: $userId},
          grade: {_is_null: false}
        }
      ) {
        nodes {
          id
          grade
          createdAt
          group {
            captainLogin
            object {
              name
            }
          }
        }
        aggregate {
          count
          avg {
            grade
          }
        }
      }
      progresses(
        where: { 
          userId: { _eq: $userId }, 
          object: { type: { _eq: "project" } }
        }, 
        order_by: {updatedAt: desc}
      ) {
        id
        object {
          id
          name
          type
        }
        grade
        createdAt
        updatedAt
      }
      skills: transactions(
        order_by: [{type: desc}, {amount: desc}],
        distinct_on: [type],
        where: {
          userId: {_eq: $userId}, 
          type: {_in: ["skill_js", "skill_go", "skill_html", "skill_prog", "skill_front-end", "skill_back-end"]}
        }
      ) {
        type
        amount
      }
    }
    event_user(where: { userId: { _eq: $userId }, eventId: {_eq: $eventId}}) {
      level
    }
  }
`;

const formatBytes = (bytes) => {
  if (bytes === 0) return '0';
  return bytes.toFixed(2);
};

const formatToMB = (bytes) => {
  if (bytes === 0) return '0 MB';
  const mb = bytes / 1000000;
  return `${mb.toFixed(2)} MB`;
};

const formatTransactionName = (path) => {
  return path
    .split('/')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' - ');
};

const getSkillColor = (type) => {
  const colors = {
    'skill_algo': { start: '#FF6B6B', end: '#FF8787', icon: '🔄' },
    'skill_prog': { start: '#4ECDC4', end: '#45B7AF', icon: '💻' },
    'skill_front': { start: '#96CEB4', end: '#88BEA6', icon: '🎨' },
    'skill_back': { start: '#9D94FF', end: '#8A82E8', icon: '⚙️' },
    'skill_sys': { start: '#FFD93D', end: '#FFD23F', icon: '🖥️' },
    default: { start: '#6C757D', end: '#495057', icon: '📚' }
  };
  return colors[type] || colors.default;
};

const calculatePieSlice = (value, total, startAngle, radius = 1) => {
  const percentage = (value / total) * 360;
  const x1 = Math.cos((startAngle * Math.PI) / 180) * radius;
  const y1 = Math.sin((startAngle * Math.PI) / 180) * radius;
  const x2 = Math.cos(((startAngle + percentage) * Math.PI) / 180) * radius;
  const y2 = Math.sin(((startAngle + percentage) * Math.PI) / 180) * radius;
  
  const largeArcFlag = percentage > 180 ? 1 : 0;
  
  return {
    path: `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
    percentage,
    endAngle: startAngle + percentage,
    midAngle: startAngle + percentage / 2
  };
};

const SkillsRadarChart = ({ skills }) => {
  const totalSkillPoints = skills.reduce((sum, s) => sum + s.amount, 0);
  const centerX = 150;
  const centerY = 150;
  const radius = 100;
  
  // Generate points for the radar chart
  const getPointCoordinates = (index, value) => {
    const angle = (Math.PI * 2 * index) / skills.length - Math.PI / 2;
    const normalizedValue = (value / totalSkillPoints) * radius * 2; // Multiply by 2 to make the chart fill more space
    return {
      x: centerX + normalizedValue * Math.cos(angle),
      y: centerY + normalizedValue * Math.sin(angle)
    };
  };

  // Generate points for the radar grid
  const generateGridPoints = (level) => {
    const points = [];
    for (let i = 0; i < skills.length; i++) {
      const angle = (Math.PI * 2 * i) / skills.length - Math.PI / 2;
      const value = radius * level;
      points.push({
        x: centerX + value * Math.cos(angle),
        y: centerY + value * Math.sin(angle)
      });
    }
    return points;
  };

  // Generate the path for the skills shape
  const generateSkillsPath = () => {
    return skills.map((skill, index) => {
      const point = getPointCoordinates(index, skill.amount);
      return (index === 0 ? 'M' : 'L') + `${point.x},${point.y}`;
    }).join(' ') + 'Z';
  };

  // Generate grid levels (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];

  return (
    <svg width="300" height="300" className="w-full">
      {/* Background grid */}
      {gridLevels.map((level) => (
        <path
          key={level}
          d={generateGridPoints(level).map((point, i) => 
            `${i === 0 ? 'M' : 'L'}${point.x},${point.y}`
          ).join(' ') + 'Z'}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      ))}
      
      {/* Axis lines */}
      {skills.map((_, index) => {
        const point = getPointCoordinates(index, totalSkillPoints / skills.length);
        return (
          <line
            key={index}
            x1={centerX}
            y1={centerY}
            x2={point.x}
            y2={point.y}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        );
      })}

      {/* Skills shape */}
      <path
        d={generateSkillsPath()}
        fill="rgba(59, 130, 246, 0.2)"
        stroke="#3b82f6"
        strokeWidth="2"
      />

      {/* Skill points */}
      {skills.map((skill, index) => {
        const point = getPointCoordinates(index, skill.amount);
        return (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#3b82f6"
          />
        );
      })}

      {/* Skill labels */}
      {skills.map((skill, index) => {
        const point = getPointCoordinates(index, totalSkillPoints / skills.length * 1.2);
        const skillName = skill.type.replace('skill_', '').replace('-', ' ').toUpperCase();
        return (
          <text
            key={index}
            x={point.x}
            y={point.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs font-medium fill-gray-600"
          >
            {skillName}
          </text>
        );
      })}
    </svg>
  );
};

const SkillsPieChart = ({ skills }) => {
  const colors = {
    'skill_js': '#F7DF1E',
    'skill_go': '#00ADD8',
    'skill_html': '#E34F26',
    'skill_prog': '#4B0082',
    'skill_front-end': '#61DAFB',
    'skill_back-end': '#3C873A'
  };

  const skillNames = {
    'skill_js': 'JavaScript',
    'skill_go': 'Go',
    'skill_html': 'HTML',
    'skill_prog': 'Programming',
    'skill_front-end': 'Front-End',
    'skill_back-end': 'Back-End'
  };

  // Format data for Recharts
  const chartData = skills.map(skill => ({
    id: skill.type,
    name: skillNames[skill.type] || skill.type.replace('skill_', '').replace('-', ' ').toUpperCase(),
    value: parseFloat(skill.amount),
    color: colors[skill.type] || '#CBD5E0'
  })).sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
          <p>{`${payload[0].payload.name}: ${payload[0].value.toFixed(1)}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  className="transition-all duration-200 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4">
        {chartData.map((skill) => (
          <div key={skill.id} className="flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: skill.color }}
            />
            <span className="text-sm font-medium text-gray-700">
              {skill.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ClientProfile = dynamic(() => import('./client'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="text-white text-xl">Loading profile...</div>
    </div>
  ),
});

export default function ProfilePage() {
  return <ClientProfile />;
}
