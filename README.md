# English Learning App

Ứng dụng học từ vựng tiếng Anh được thiết kế theo hướng đối tượng với Flask backend và vanilla JavaScript frontend.

## Tính năng chính

- **Đăng ký/Đăng nhập**: Hệ thống xác thực người dùng với JWT
- **Học từ vựng**: Flashcard tương tác với từ vựng theo chủ đề
- **Bài kiểm tra**: Quiz trắc nghiệm để kiểm tra kiến thức
- **Theo dõi tiến độ**: Thống kê học tập cá nhân
- **Giao diện responsive**: Tương thích với mọi thiết bị

## Cấu trúc dự án

\`\`\`
english-learning-app/
├── app.py                 # Flask application chính
├── netlify/
│   └── functions/
│       └── api.py        # Netlify Functions cho deployment
├── static/
│   ├── css/
│   │   └── style.css     # Styles chính
│   └── js/
│       └── app.js        # JavaScript frontend
├── templates/
│   └── index.html        # Template HTML chính
├── requirements.txt      # Python dependencies
├── netlify.toml         # Netlify configuration
└── README.md
\`\`\`

## Cài đặt và chạy local

1. Clone repository:
\`\`\`bash
git clone <repository-url>
cd english-learning-app
\`\`\`

2. Cài đặt dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

3. Chạy ứng dụng:
\`\`\`bash
python app.py
\`\`\`

4. Truy cập: http://localhost:5000

## Deploy lên Netlify

1. Push code lên GitHub repository
2. Kết nối repository với Netlify
3. Netlify sẽ tự động build và deploy

### Cấu hình Netlify

- Build command: `echo 'Build complete'`
- Publish directory: `.`
- Functions directory: `netlify/functions`

## Sử dụng

1. **Đăng ký tài khoản** hoặc đăng nhập
2. **Chọn chủ đề** từ danh sách có sẵn
3. **Học từ vựng** bằng flashcard
4. **Làm bài kiểm tra** để kiểm tra kiến thức
5. **Theo dõi tiến độ** học tập

## Công nghệ sử dụng

### Backend
- **Python Flask**: Web framework
- **SQLite**: Database
- **JWT**: Authentication
- **Flask-CORS**: Cross-origin requests

### Frontend
- **HTML5/CSS3**: Markup và styling
- **Bootstrap 5**: UI framework
- **Vanilla JavaScript**: Logic frontend
- **Font Awesome**: Icons

### Deployment
- **Netlify**: Hosting platform
- **Netlify Functions**: Serverless backend

## Cấu trúc Database

### Bảng chính:
- `users`: Thông tin người dùng
- `topics`: Chủ đề học tập
- `vocabularies`: Từ vựng
- `quizzes`: Câu hỏi kiểm tra
- `results`: Kết quả bài kiểm tra
- `progress`: Tiến độ học tập

## API Endpoints

- `POST /api/register`: Đăng ký tài khoản
- `POST /api/login`: Đăng nhập
- `GET /api/topics`: Lấy danh sách chủ đề
- `GET /api/topics/{id}/vocabularies`: Lấy từ vựng theo chủ đề
- `GET /api/topics/{id}/quiz`: Lấy câu hỏi quiz
- `POST /api/quiz/submit`: Nộp bài kiểm tra
- `GET /api/progress`: Lấy thống kê tiến độ

## Tài khoản demo

- **Username**: admin
- **Password**: admin123
- **Role**: admin

## Tính năng nâng cao (có thể mở rộng)

- [ ] Luyện phát âm với Web Speech API
- [ ] Thông báo nhắc học hàng ngày
- [ ] Chế độ tối (Dark mode)
- [ ] Xuất/nhập dữ liệu học tập
- [ ] Tích hợp AI cho gợi ý học tập
- [ ] Ứng dụng mobile với React Native

## Đóng góp

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## License

MIT License - xem file LICENSE để biết thêm chi tiết.
