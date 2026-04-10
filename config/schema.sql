-- 1. 기관 정보
CREATE TABLE IF NOT EXISTS Institutions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login_id VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    inst_name VARCHAR(100) NOT NULL,
    subscription_status ENUM('free', 'pro', 'enterprise') DEFAULT 'free',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 클래스 정보
CREATE TABLE IF NOT EXISTS Classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(100) NOT NULL,
    institution_id INT NOT NULL,
    start_date DATE,
    end_date DATE,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_class_institution FOREIGN KEY (institution_id) REFERENCES Institutions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 사용자 정보 (last_login_at 삭제, createdAt/updatedAt 생성)
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login_id VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role ENUM('student', 'institution', 'instructor', 'admin') DEFAULT 'student',
    enroll_status ENUM('active', 'dropout', 'graduated') DEFAULT 'active',
    institution_id INT,
    class_id INT,
    current_candy_count INT DEFAULT 0,
    total_candy_count INT DEFAULT 0,
    attendance_days INT DEFAULT 0,
    streak INT DEFAULT 0,
    privacy_consent BOOLEAN DEFAULT FALSE,
    third_party_consent BOOLEAN DEFAULT FALSE,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_institution FOREIGN KEY (institution_id) REFERENCES Institutions(id) ON DELETE SET NULL,
    CONSTRAINT fk_user_class FOREIGN KEY (class_id) REFERENCES Classes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. 데일리 리플렉션
CREATE TABLE IF NOT EXISTS Reflections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    origin_text TEXT NOT NULL,
    gpt_summary TEXT,
    rep_emotion VARCHAR(20),
    sentiment_score DECIMAL(5, 4),
    daily_risk DECIMAL(5, 2),
    keywords JSON,
    happy_prob DECIMAL(5, 4),
    sad_prob DECIMAL(5, 4),
    angry_prob DECIMAL(5, 4),
    heartache_prob DECIMAL(5, 4),
    anxious_prob DECIMAL(5, 4),
    embarrassed_prob DECIMAL(5, 4),
    cumulative_days INT DEFAULT 0,
    cumulative_absence_days INT DEFAULT 0,
    image_data LONGTEXT,
    is_private BOOLEAN DEFAULT FALSE,
    analysis_status ENUM('pending', 'analyzing', 'completed', 'failed') DEFAULT 'pending',
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reflection_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. AI 분석 결과
CREATE TABLE IF NOT EXISTS Analyses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    happy_prob FLOAT,
    fulfill_prob FLOAT,
    relief_prob FLOAT,
    gratitude_prob FLOAT,
    proud_prob FLOAT,
    sad_prob FLOAT,
    anxious_prob FLOAT,
    defeat_prob FLOAT,
    stress_prob FLOAT,
    embarrassed_prob FLOAT,
    bored_prob FLOAT,
    exhausted_prob FLOAT,
    depressed_prob FLOAT,
    ers FLOAT,
    cer FLOAT,
    dropout_prob FLOAT,
    gpt_EDU_summary TEXT,
    ReflectionId INT,
    UserId INT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
