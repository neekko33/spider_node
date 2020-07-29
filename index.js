const Crawler = require('crawler');
const schedule = require('node-schedule');
const mysql = require('mysql');

// 配置 mysql 连接池
const pool = mysql.createPool({
  user: 'root',
  password: '',
  port: '3306',
  database: '',
  host: '',
});

/**
 *
 * @param {*} sql sql语句
 * @param {*} val 参数
 */
const query = (sql, val) =>
  new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err);
      }
      connection.query(sql, val, (err, fields) => {
        if (err) {
          reject(err);
        }
        resolve(fields);
        connection.release();
      });
    });
  });

const c = new Crawler({
  callback: (err, res, done) => {
    if (err) {
      console.log(err);
    } else {
      const hotNews = [];
      const $ = res.$;
      $(
        '#add-docs-block li div.list-info-box div.list-title-box a.list-title h3'
      ).each((idx, el) => {
        if (idx > 5) return;
        let news = {
          id: idx + 1,
          title: $(el).text(),
          href: 'https://www.yystv.cn/' + $(el).attr('data-src'),
          bg: '',
        };
        hotNews.push(news);
      });
      $('ul#add-docs-block li a.list-item div.item-bg').each((idx, el) => {
        if (idx > 5) return;
        hotNews[idx].bg = $(el)
          .attr('style')
          .split("'")[1]
          .replace(/_w360/, '');
      });
      const sql = `UPDATE yys_tv SET title=?,href=?,bg=? WHERE id=?`;
      new Promise((resolve, reject) => {
        resolve();
      })
        .then(() => {
          for (let i = 0; i < hotNews.length; i++) {
            let item = hotNews[i];
            query(sql, [item.title, item.href, item.bg, item.id]);
          }
        })
        .then(() => {
          done();
          console.log(`Today:${new Date()} ===> finished`);
        });
    }
  },
});
console.log('Spider start...');
// 定时执行任务
schedule.scheduleJob('0 5 15 * * *', () => {
  console.log(`Today:${new Date()} ===> running...`);
  c && c.queue('https://www.yystv.cn/');
});
