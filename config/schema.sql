-- 1. 기관 정보 (수정: Users와의 관계 명확화)
CREATE TABLE IF NOT EXISTS Institutions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login_id VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    inst_name VARCHAR(100) NOT NULL,
    subscription_status ENUM('free', 'pro', 'enterprise') DEFAULT 'free',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 클래스 정보
CREATE TABLE IF NOT EXISTS Classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(100) NOT NULL,
    institution_id INT NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_class_institution FOREIGN KEY (institution_id) REFERENCES Institutions(id) ON DELETE CASCADE,
    INDEX idx_class_institution (institution_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 사용자 정보 (수정: 에러 원인이던 role ENUM 확장 및 timestamp 자동화)
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login_id VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    -- 'institution' 값을 추가하여 Data truncated 에러 해결
    role ENUM('student', 'institution', 'instructor', 'admin') DEFAULT 'student',
    enroll_status ENUM('active', 'dropout', 'graduated') DEFAULT 'active',
    institution_id INT,
    class_id INT,
    current_candy_count INT DEFAULT 0,
    total_candy_count INT DEFAULT 0,
    attendance_days INT DEFAULT 0,
    streak INT DEFAULT 0,
    last_login_at DATETIME,
    privacy_consent BOOLEAN DEFAULT FALSE,
    third_party_consent BOOLEAN DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_institution FOREIGN KEY (institution_id) REFERENCES Institutions(id) ON DELETE SET NULL,
    CONSTRAINT fk_user_class FOREIGN KEY (class_id) REFERENCES Classes(id) ON DELETE SET NULL,
    INDEX idx_user_class (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. 데일리 리플렉션 (수정: 소수점 정밀도 유지 및 인덱스 최적화)
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
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reflection_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_user_submitted (user_id, submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. AI 분석 결과 (KOTE 13종 감정확률 + ERS/CER/이탈확률 + GPT 요약)
CREATE TABLE IF NOT EXISTS `Analyses` (
    `id`               INT AUTO_INCREMENT PRIMARY KEY,
    `happy_prob`       FLOAT,
    `fulfill_prob`     FLOAT,
    `relief_prob`      FLOAT,
    `gratitude_prob`   FLOAT,
    `proud_prob`       FLOAT,
    `sad_prob`         FLOAT,
    `anxious_prob`     FLOAT,
    `defeat_prob`      FLOAT,
    `stress_prob`      FLOAT,
    `embarrassed_prob` FLOAT,
    `bored_prob`       FLOAT,
    `exhausted_prob`   FLOAT,
    `depressed_prob`   FLOAT,
    `ers`              FLOAT COMMENT '감정 회복 점수',
    `cer`              FLOAT COMMENT '누적 감정 위험 지수',
    `dropout_prob`     FLOAT COMMENT '중도이탈 확률',
    `gpt_EDU_summary`  TEXT  COMMENT 'GPT 학습 요약',
    `ReflectionId`     INT,
    `UserId`           INT,
    `createdAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_analyses_user (UserId),
    INDEX idx_analyses_reflection (ReflectionId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6~7번 테이블 생략 (동일한 로직으로 TIMESTAMP 자동화 적용 권장)