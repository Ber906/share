const axios = require('axios');
const express = require('express');
const app = express();

// Middleware para mabasa ang JSON payload mula sa request body
app.use(express.json());

// Helper function para sa delay (pause) sa pagitan ng requests
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function deletePost(postId, accessToken) {
  try {
    await axios.delete(`https://graph.facebook.com/${postId}?access_token=${accessToken}`);
    console.log(`Post deleted: ${postId}`);
  } catch (error) {
    console.error('Failed to delete post:', error.response?.data || error.message);
  }
}

app.post('/share', async (req, res) => {
  try {
    // Kunin ang mga kinakailangang data sa req.body
    const { token: accessToken, url: shareUrl, amount } = req.body;
    const shareAmount = parseInt(amount);

    // Validation
    if (!accessToken || !shareUrl || isNaN(shareAmount) || shareAmount <= 0) {
      return res.status(400).json({ 
        status: false, 
        message: 'Invalid input. Please provide a valid token, url, and a positive amount.' 
      });
    }

    const timeInterval = 1500; // 1.5 seconds delay
    const deleteAfter = 60 * 60; // 1 hour in seconds
    const createdPostIds = [];

    // Mag-respond kaagad sa client na nagsimula na ang process
    res.json({ status: true, message: `Started sharing process for ${shareAmount} times.` });

    // Asynchronous loop para sa pag-share
    for (let i = 0; i < shareAmount; i++) {
      try {
        const response = await axios.post(
          `https://graph.facebook.com/me/feed?access_token=${accessToken}&fields=id&published=0`,
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
          }
        );

        const postId = response?.data?.id;
        console.log(`Post shared: ${i + 1}/${shareAmount}`);
        console.log(`Post ID: ${postId || 'Unknown'}`);

        if (postId) {
          createdPostIds.push(postId);
          // Mag-set ng timer para burahin ang post pagkalipas ng 1 oras
          setTimeout(() => {
            deletePost(postId, accessToken);
          }, deleteAfter * 1000);
        }
      } catch (error) {
        console.error(`Failed to share post #${i + 1}:`, error.response?.data || error.message);
      }

      // Hintay muna ng 1.5 seconds bago ang susunod na share (huwag mag-delay sa huling item)
      if (i < shareAmount - 1) {
        await sleep(timeInterval);
      }
    }

    console.log('DONE SHARING ALL POSTS');
  } catch (error) {
    console.error('Error in route handler:', error.message);
  }
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
