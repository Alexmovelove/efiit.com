
//*******
//Version 14.07.2023 
//Version 07:41 AM
//*******
// Создание комментария на STEEMIT
const wifkey = 'xxx'; // Замените на ваш приватный ключ
const votey = 'efiit.com'; // Parent Author

const express = require('express');
const session = require('express-session');
const app = express();
const steem = require('steem');
const fs = require('fs');
const path = require('path');

const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'main',
  password: 'BogSilSavaof',
  database: 'efiit'
});

function checkDatabaseConnection() {
  if (connection.state === 'disconnected') {
    console.error('Ошибка подключения к базе данных');
    return false;
  }
  return true;
}

connection.connect((err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err);
    return;
  }
  console.log('Подключение к базе данных успешно установлено');
});

// Настроить статический хостинг
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'secret_key',
  resave: true,
  saveUninitialized: true,
    cookie: {
    maxAge: 604800000  // 7 дней в миллисекундах
  }
}));

app.get('/course/:courseId/start', function(req, res) {
  const courseId = req.params.courseId;
  const userId = req.session.userId; // Предполагается, что у вас есть сессия для аутентификации пользователя
console.log(userId);
console.log(courseId);

  if (!userId) {
    // Пользователь не авторизован, выводим сообщение или перенаправляем на страницу аутентификации
    return res.send('You are not logged in <a href="/login-register.html">Login</a>');
  }
  
  // Проверить, подписан ли пользователь на данный курс
  const query = `SELECT * FROM enrollments WHERE student_id = ${userId} AND course_id = ${courseId}`;
  
  if (!checkDatabaseConnection()) {
    return res.sendStatus(500);
  }
  
  connection.query(query, function(error, results) {
    if (error) {
      console.error('Error querying database:', error);
      return res.sendStatus(500);
    }

    if (results.length === 0) {
      // Пользователь не подписан на курс, добавить подписку и установить current_lesson_id
      const initialLessonId = 1; // Здесь предполагается, что первый урок имеет идентификатор 1
      const insertQuery = `INSERT INTO enrollments (student_id, course_id, current_lesson_id)
                           VALUES (${userId}, ${courseId}, ${initialLessonId})`;

  if (!checkDatabaseConnection()) {
    return res.sendStatus(500);
  }


      connection.query(insertQuery, function(error) {
        if (error) {
          console.error('Error inserting enrollment:', error);
          return res.sendStatus(500);
        }
        // Перенаправить пользователя на страницу первого урока
        res.redirect(`/course/${courseId}/lesson/${initialLessonId}`);
      });
    } else {
      // Пользователь уже подписан на курс, получить current_lesson_id
      const currentLessonId = results[0].current_lesson_id;
      // Перенаправить пользователя на страницу текущего урока
      res.redirect(`/course/${courseId}/lesson/${currentLessonId}`);
    }
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!checkDatabaseConnection()) {
    return res.sendStatus(500);
  }
  
  // Проверьте учетные данные пользователя в базе данных
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Ошибка выполнения запроса:', err);
      res.sendStatus(500);
      return;
    }

    if (results.length > 0) {
      const user = results[0];

      // Пользователь аутентифицирован, сохраните его ID и роль в сессии
      req.session.userId = user.id;
      
      // Установите роль пользователя в сессии
      if (user.role === 'teacher') {
        req.session.userRole = 'teacher';
      } else {
        req.session.userRole = 'student'; // Или другая роль
      }
      
      res.redirect('/dashboard');
    } else {
      res.send('Invalid username or password');
    }
  });
});


app.get('/dashboard', (req, res) => {
  // Проверьте, аутентифицирован ли пользователь
  if (req.session.userId) {
    // Проверьте роль пользователя
    if (req.session.userRole === 'teacher') {
      // Пользователь является учителем, перенаправьте на страницу учителя
      res.redirect('/teacher');
    } else {
      // Пользователь является студентом или другой ролью, перенаправьте на соответствующую страницу
      res.redirect('/course-list.html');
    }
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  // Очистите сессию и перенаправьте пользователя на страницу входа
  req.session.destroy();
  res.redirect('/login');
});


app.get('/', function(req, res) {
    fs.readFile('index.html', 'utf8', function(err, data) {
        if (err) {
            console.log('Error: ' + err);
            return res.sendStatus(500);
        }
        res.send(data);
    });
});

app.get('/course/:courseId/lesson/:lessonId', function(req, res) {
  const courseId = req.params.courseId;
  const lessonId = req.params.lessonId;

  if (!checkDatabaseConnection()) {
    return res.sendStatus(500);
  }
  
  // Здесь можно выполнить запрос к базе данных для получения информации о конкретном уроке
  // Например:
  const query = `SELECT * FROM lessons WHERE id = ${lessonId} AND course_id = ${courseId}`;

  connection.query(query, function(err, result) {
    if (err) {
      console.log('Error retrieving lesson:', err);
      return res.sendStatus(500); // Ошибка сервера
    }

    if (result.length === 0) {
      return res.sendStatus(404); // Урок не найден
    }

    const lesson = result[0];
    const lessonText = lesson.content; // Получение значения text из объекта lesson

console.log('lesson:', lesson);
console.log('lesson:', lessonText);

 let parts = lessonText.split("@")[1].split("/");
    let author = parts[0];
    let permlink = parts[1];

    console.log('author:', author);
    console.log('permlink:', permlink);

    req.session.author = author;
	
    steem.api.getContent(author, permlink, function(err, result) {
        if (!err) {
            fs.readFile('template-fulltest.html', 'utf8', function(err, data) {
                if (err) {
                    console.log('Error: ' + err);
                    return res.sendStatus(500);
                }


                let imageMatch = result.body.match(/\!\[.*?\]\((.*?)\)/);
                let imageUrl = imageMatch ? imageMatch[1] : '';
                let bodyWithoutImage = result.body.replace(/\!\[.*?\]\(.*?\)\.png\)/, '');

                let bodyHtml = bodyWithoutImage.replace(/\n/g, '<br>'); // замена \n на <br>

                data = data.replace('@@@title@@@', result.title)
                    .replace('@@@date@@@', result.created)
                    .replace('@@@author@@@', author)
                    .replace('@@@body@@@', bodyHtml)
                    .replace('@@@image@@@', imageUrl);

              res.send(data);
            });
        } else {
            console.log('Error: ' + err);
          return res.sendStatus(500);
        }
    });

  req.session.lessonNumber = lessonId;
  req.session.courseNumber = courseId;
  req.session.permlink = permlink;

	//res.send(lessonText);
  });
});


app.post('/submit-homework', (req, res) => {
  const { name, email, message } = req.body;
  const lessonNumber = req.session.lessonNumber;
  const courseNumber = req.session.courseNumber;
  const author = req.session.author;
  const permlink = req.session.permlink;

  console.log('lessonNumber:', lessonNumber);
  console.log('courseNumber:', courseNumber);
  console.log('author:', author);
  console.log('permlink:', permlink);
  console.log('message:', message);


  // Проверка, что пользователь авторизован
  const userId = req.session.userId;
  if (!userId) {
    return res.send('You are not logged in <a href="/login-register.html">Login</a>');
  }

	const comment_permlink = new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
						
  const test2 = permlink; // Parent Permlink
  const answer2 = message; // Body
 
 console.log('votey:', votey);
 console.log('wifkey:', wifkey);
 console.log('comment_permlink:', comment_permlink);
  
  steem.broadcast.comment(
    wifkey,
    author,
    test2,
    votey,
    comment_permlink,
    '',
    answer2,
    { tags: ['thanks'], app: 'ganeshaway' },
    function(err, result) {
      if (err) {
        console.error('Error posting comment:', err);
        return res.sendStatus(500);
      }

      const homeworkData = {
        message,
        user_id: userId,
        lesson_number: lessonNumber,
        course_number: courseNumber,
        comment_permlink: comment_permlink
      };

      const query = 'INSERT INTO homework SET ?';
	  
  if (!checkDatabaseConnection()) {
    return res.sendStatus(500);
  }
      connection.query(query, homeworkData, (error, result) => {
        if (error) {
          console.error('Error:', error);
          return res.sendStatus(500);
        }

        return res.send('Your homework has been submitted. Thank you. Please go to the <a href="/course-list.html">course list</a>');
      });
    }
  );
});

app.get('/teacher', (req, res) => {
  // Проверьте, аутентифицирован ли пользователь в роли учителя
  if (req.session.userId && req.session.userRole === 'teacher') {
    // Получите список ответов из таблицы homework
    const query = 'SELECT * FROM homework WHERE approved = 0'; // Выбираем только неподтвержденные домашние задания
    
  if (!checkDatabaseConnection()) {
    return res.sendStatus(500);
  }
  
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Error querying database:', error);
        return res.sendStatus(500);
      }
      
      // Отобразите список ответов и кнопку "одобрить" для каждого ответа
      let responseHTML = '';
      for (const result of results) {
        responseHTML += `
          <div>
            <p>Student ID: ${result.user_id}</p>
            <p>Lesson Number: ${result.lesson_number}</p>
            <p>Course Number: ${result.course_number}</p>
            <p>Comment Permlink: ${result.comment_permlink}</p>
            <p>Message: ${result.message}</p>
            <form action="/approve-homework" method="post">
              <input type="hidden" name="homeworkId" value="${result.id}">
              <button type="submit">Approve</button>
            </form>
          </div>
          <hr>
        `;
      }
      
      // Отправьте HTML-страницу с ответами учителю
      res.send(`
        <h1>Teacher Dashboard</h1>
        ${responseHTML}
      `);
    });
  } else {
    // Если пользователь не аутентифицирован в роли учителя, перенаправьте на страницу входа
    res.redirect('/login-register.html');
  }
});

app.post('/approve-homework', (req, res) => {
  // Проверьте, аутентифицирован ли пользователь в роли учителя
  if (req.session.userId && req.session.userRole === 'teacher') {
    const { homeworkId } = req.body;

    // Проверьте, есть ли значение homeworkId
    if (!homeworkId) {
      return res.json({ success: false });
    }

    // Обновите данные в таблице homework
    const updateHomeworkQuery = `UPDATE homework SET approved = 1 WHERE id = ${homeworkId}`;
	
	  if (!checkDatabaseConnection()) {
    return res.sendStatus(500);
  }
    
    connection.query(updateHomeworkQuery, (error, result) => {
      if (error) {
        console.error('Error updating homework:', error);
        return res.json({ success: false });
      }

      // Обновите текущий урок студента
      const updateEnrollmentQuery = `UPDATE enrollments SET current_lesson_id = current_lesson_id + 1 WHERE student_id = ${req.session.userId}`;
      
	  
	   if (!checkDatabaseConnection()) {
    return res.sendStatus(500);
  }
  
      connection.query(updateEnrollmentQuery, (error, result) => {
        if (error) {
          console.error('Error updating enrollment:', error);
          return res.json({ success: false });
        }
        
        return res.json({ success: true });
      });
    });
  } else {
    // Если пользователь не аутентифицирован в роли учителя, верните ошибку
    return res.json({ success: false });
  }
});

app.get('/dashboard', (req, res) => {
  // Проверьте, аутентифицирован ли пользователь
  const userId = req.session.userId;
  if (!userId) {
    return res.redirect('/login');
  }

  // Получите список подписанных курсов для студента
  const query = `SELECT c.id AS course_id, c.title AS course_title, l.id AS lesson_id, l.title AS lesson_title
                 FROM enrollments e
                 JOIN courses c ON e.course_id = c.id
                 JOIN lessons l ON e.current_lesson_id = l.id
                 WHERE e.student_id = ${userId}`;

  if (!checkDatabaseConnection()) {
    return res.sendStatus(500);
  }

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error querying database:', error);
      return res.sendStatus(500);
    }

    // Отправьте HTML-страницу с данными о курсах и уроках
    res.send(`
      <h1>Dashboard</h1>
      <h2>Available Courses</h2>
      <ul>
        ${results.map(result => `<li>${result.course_title} - Lesson: ${result.lesson_title}</li>`).join('')}
      </ul>
    `);
  });
});


app.get('/:filename', function(req, res) {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, filename);

  fs.readFile(filePath, 'utf8', function(err, data) {
    if (err) {
      console.log('Error: ' + err);
      return res.sendStatus(404); // File not found
    }
    
    // Вставьте данные сессии в HTML-страницу
    const modifiedData = data.replace('{{userId}}', req.session.userId || '');
    
    res.send(modifiedData);
  });
});

app.listen(3000, () => {
  console.log('Сервер запущен на порту 3000');
});
