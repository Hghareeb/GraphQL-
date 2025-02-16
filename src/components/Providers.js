'use client';

import { ApolloClient, ApolloProvider, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { useRouter } from 'next/navigation';

export default function Providers({ children }) {
  const router = useRouter();

  const httpLink = createHttpLink({
    uri: process.env.GRAPHQL_ENDPOINT,
    credentials: 'include',
  });

  const authLink = setContext((_, { headers }) => {
    let token = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
    }

    return {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      }
    };
  });

  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message }) => {
        console.error('GraphQL Error:', message);
        if (message.includes('JWSInvalidSignature') || 
            message.includes('Could not verify JWT') || 
            message.includes('invalid token')) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            router.push('/auth');
          }
        }
      });
    }
    if (networkError) {
      console.error('Network Error:', networkError);
    }
  });

  const client = new ApolloClient({
    link: errorLink.concat(authLink.concat(httpLink)),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'network-only',
      },
      query: {
        fetchPolicy: 'network-only',
      },
    },
  });

  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
}
