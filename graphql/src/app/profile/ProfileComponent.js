'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { gql, useQuery, ApolloClient, InMemoryCache } from '@apollo/client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || '';
  }
  return '';
};

const client = new ApolloClient({
  uri: 'https://learn.reboot01.com/api/graphql-engine/v1/graphql',
  cache: new InMemoryCache(),
  headers: {
    'Authorization': `Bearer ${getToken()}`
  }
});

// Your existing GraphQL query and other functions here...

export default function ProfileComponent() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [showAllAudits, setShowAllAudits] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken || '');
      
      if (!storedToken) {
        router.push('/');
        return;
      }

      try {
        const base64Url = storedToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        const decoded = JSON.parse(jsonPayload);
        setUserId(decoded.user.id);
        setEventId(decoded.user.eventId);
      } catch (error) {
        console.error('Error extracting user ID:', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        router.push('/');
      }
    }
  }, [router]);

  // Rest of your component code...

  return (
    <div>
      {/* Your existing JSX */}
    </div>
  );
}
