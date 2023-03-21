import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom';

import Head from 'next/head';
import styles from './post.module.scss';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter()

  if (router.isFallback) {
    return <h1>Carregando...</h1>
  }

  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;

    const words = contentItem.body.map(item => item.text.split(' ').length);
    words.map(word => (total += word));
    return total;
  }, 0);

  const readTime = Math.ceil(totalWords / 200);

  return (
    <>
      <Head>
        <title>spacetraveling | Post</title>
      </Head>

      <img src={post.data.banner.url} alt="logo" className={styles.image}/>

      <main className={styles.container}>
        <div className={styles.content}>
          <div className={styles.topo}>
            <h1>{post.data.title}</h1>
            <ul>
              <li>
                <FiCalendar />
                {post.first_publication_date}
                </li>
              <li>
                <FiUser />
                {post.data.author}
                </li>
              <li>
                <FiClock/>
                {`${readTime} min`}
                </li>
            </ul>
          </div>
        </div>
        {post.data.content.map((content) => (
          <article key={content.heading}>
          <h2>{content.heading}</h2>
          <div dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body) }} />
        </article>
        ))}

      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('post');

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      }
    }
  })

  return {
    paths,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: new Date(response.first_publication_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url
      },
      content: response.data.content.map(post => {
        return {
          heading: post.heading,
          body: [...post.body],
        }
      })
    },
  }

  return {
    props: {
      post,
    }
  }
};
