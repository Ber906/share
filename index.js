const axios = require('axios');
const express = require('express');
const app = express();

// Middleware para mabasa ang JSON payload mula sa request body
app.use(express.json());

// Helper function para sa delay (pause) sa pagitan ng requests
app.get('/api/share', async (req, res) => {
  const accessToken = req.query.token;
  const shareUrl = req.query.url;

    if (!accessToken || !shareUrl) {
      return res.status(400).json({ error: 'Both token and URL are required' });
    }

    const shareCount = 22200;
    const timeInterval = 1500;
    const deleteAfter = 60 * 60;

    let sharedCount = 0;
    let timer = null;

    try {
      const response = await axios.get(`https://graph.facebook.com/me?access_token=${accessToken}`);
      if (response.data.error) {
        return res.status(401).json({ error: 'Invalid access token' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Invalid access token' });
    }

    async function sharePost() {
      try {
        const response = await axios.post(
          `https://graph.facebook.com/me/feed?access_token=${accessToken}&fields=id&limit=1&published=0`,
          {
            link: shareUrl,
            privacy: { value: 'SELF' },
            no_story: true,
          },
          {
            headers: {
              authority: 'graph.facebook.com',
              'cache-control': 'max-age=0',
              'sec-ch-ua-mobile': '?0',
              'user-agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36',
            },
            method: 'post',
          }
        );

        sharedCount++;
        const postId = response?.data?.id;

        console.log(`Post shared: ${sharedCount}`);
        console.log(`Post ID: ${postId || 'Unknown'}`);

        if (sharedCount === shareCount) {
          clearInterval(timer);
          console.log('Finished sharing posts.');

          if (postId) {
            setTimeout(() => {
              deletePost(postId);
            }, deleteAfter * 1000);
          }
        }
      } catch (error) {
        console.error('Failed to share post:', error.response.data);
      }
    }

    async function deletePost(postId) {
      try {
        await axios.delete(`https://graph.facebook.com/${postId}?access_token=${accessToken}`);
        console.log(`Post deleted: ${postId}`);
      } catch (error) {
        console.error('Failed to delete post:', error.response.data);
      }
    }

    timer = setInterval(sharePost, timeInterval);

    setTimeout(() => {
      clearInterval(timer);
      console.log('Loop stopped.');
    }, shareCount * timeInterval);

    res.json({ message: 'Sharing process started' });
  });

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
