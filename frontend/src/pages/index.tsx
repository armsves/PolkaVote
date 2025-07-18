import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { VotingInterface } from "../components/VotingInterface";
import { myTokenModulePrivateVotingAddress } from "../generated";

const Home: NextPage = () => {
  const contractAddress = myTokenModulePrivateVotingAddress[420420422];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Head>
        <title>PolkaVote</title>
        <meta
          content="Private voting with Noir and RainbowKit"
          name="description"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      {/* Navbar */}
      <nav
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 2rem',
          borderBottom: '1px solid #eee',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/polkavote-logo.png" alt="Logo" style={{ width: 100, height: 100, marginRight: 8 }} />
        </div>
        {/* Project Name */}
        <div style={{ fontWeight: 'bold', fontSize: '1.5rem', letterSpacing: 1 }}>
          <span style={{ color: '#e6007a' }}>Polka</span>Vote
        </div>
        {/* Wallet Connect */}
        <div>
          <ConnectButton />
        </div>
      </nav>

      <main className={styles.main} style={{ flex: 1 }}>
        <VotingInterface contractAddress={contractAddress} />
      </main>

      <footer className={styles.footer}>
        <span>
          © {new Date().getFullYear()} PolkaVote — Private voting powered by Noir &amp; RainbowKit
        </span>
      </footer>
    </div>
  );
};

export default Home;
