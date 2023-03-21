import { GetStaticProps } from 'next';
import { getPrismicClient } from '../services/prismic';
import { FiCalendar } from "react-icons/fi";
import { FiUser } from "react-icons/fi";

import Head from 'next/head';
import styles from './home.module.scss';
import { useState } from 'react';
import Link from 'next/link';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const postInitial = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: post.first_publication_date
    }
  })

  const [post, setPost]  = useState<Post[]>(postInitial);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [currentPage, setCurrentPage] = useState(1);

  async function handleCarregarMais() {
    if (currentPage !== 1 && nextPage === null) {
      return;
    }

    const response = await fetch(`${nextPage}`).then(response => response.json());
    setNextPage(response.next_page);
    setCurrentPage(response.page);

    const newPost = response.results.map(post => ({
      uid: post.uid,
      first_publication_date: new Date(post.first_publication_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }));

    setPost([...post, ...newPost]);
  }

  return (
    <>
      <Head>
        <title>spacetraveling | Home</title>
      </Head>
      <main className={styles.container}>
        <div className={styles.posts}>

      { post.map(post =>
         (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a key={post.uid}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
              <div className={styles.info}>
                <time><FiCalendar/> {post.first_publication_date}</time>
                <p><FiUser/> {post.data.author}</p>
              </div>
              </a>
            </Link>
        )
      ) }
      </div>
      {nextPage ? (
        <button type='button' onClick={() => handleCarregarMais()}>Carregar mais posts</button>
      ) : null}
    </main>

    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType<any>('posts', {
    pageSize: 1,
  });

  const posts = postsResponse.results.map(post => ({
    uid: post.uid,
    first_publication_date: new Date(post.first_publication_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    }
  }));

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  }

  return {
    props: {
      postsPagination,
    }
  }
};
