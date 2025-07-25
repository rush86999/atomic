import React, { useEffect, useState } from 'react';
import withSideBarWithHeader from '../../layouts/SideBarWithHeader';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@mui/material';
import { useUser } from '../../lib/user-context';

const PlaidLink = ({ user, setAccounts, setTransactions }) => {
  const [linkToken, setLinkToken] = useState(null);

  useEffect(() => {
    const createLinkToken = async () => {
      const response = await fetch('/api/financial/plaid/create_link_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id }),
      });
      const { data } = await response.json();
      setLinkToken(data.link_token);
    };
    createLinkToken();
  }, [user]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      await fetch('/api/financial/plaid/exchange_public_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_token, user_id: user.id }),
      });
      // After successful link, fetch accounts and transactions
      const accountsResponse = await fetch(`/api/financial/accounts?user_id=${user.id}`);
      const accountsData = await accountsResponse.json();
      setAccounts(accountsData.data);

      const transactionsResponse = await fetch(`/api/financial/transactions?user_id=${user.id}&start_date=2023-01-01&end_date=2023-12-31`);
      const transactionsData = await transactionsResponse.json();
      setTransactions(transactionsData.data);
    },
  });

  return (
    <Button variant="contained" onClick={() => open()} disabled={!ready}>
      Connect a bank account
    </Button>
  );
};


const Finance = () => {
  const { user } = useUser();
  const { hasRole } = useUserRole();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [netWorth, setNetWorth] = useState(0);

  useEffect(() => {
    const getInvestments = async () => {
      const response = await fetch(`/api/financial/investments?user_id=${user.id}`);
      const { data } = await response.json();
      setInvestments(data);
    };
    if (user && hasRole('finance')) {
      getInvestments();
    }
  }, [user, hasRole]);

  useEffect(() => {
    const getLiabilities = async () => {
      const response = await fetch(`/api/financial/liabilities?user_id=${user.id}`);
      const { data } = await response.json();
      setLiabilities(data);
    };
    if (user && hasRole('finance')) {
        getLiabilities();
    }
  }, [user, hasRole]);

  useEffect(() => {
    const getNetWorth = async () => {
      const response = await fetch(`/api/financial/net_worth?user_id=${user.id}`);
      const { data } = await response.json();
      setNetWorth(data.net_worth);
    };
    if (user && hasRole('finance')) {
      getNetWorth();
    }
  }, [user, hasRole]);

  if (!hasRole('finance')) {
    return <div>You do not have permission to view this page.</div>;
  }

  return (
    <div>
      <h1>Finance</h1>
      <PlaidLink user={user} setAccounts={setAccounts} setTransactions={setTransactions} />

      <h2>Net Worth</h2>
      <p>${netWorth}</p>

      <h2>Accounts</h2>
      <ul>
        {accounts.map((account) => (
          <li key={account.account_id}>
            {account.name} - {account.balances.current}
          </li>
        ))}
      </ul>

      <h2>Transactions</h2>
      <ul>
        {transactions.map((transaction) => (
          <li key={transaction.transaction_id}>
            {transaction.name} - {transaction.amount}
          </li>
        ))}
      </ul>

      <h2>Investments</h2>
      <ul>
        {investments.map((investment) => (
          <li key={investment.security_id}>
            {investment.name} - {investment.quantity}
          </li>
        ))}
      </ul>

        <h2>Liabilities</h2>
        <ul>
            {liabilities.map((liability) => (
                <li key={liability.account_id}>
                    {liability.name} - {liability.last_payment_amount}
                </li>
            ))}
        </ul>
    </div>
  );
};

export default withSideBarWithHeader(Finance);
