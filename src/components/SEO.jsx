import Head from 'next/head';

export default function SEO({ description }) {
  return (
    <Head>
      {description ? <meta name="description" content={description} /> : null}
    </Head>
  );
}
