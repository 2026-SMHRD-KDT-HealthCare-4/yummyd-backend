-- 중도이탈 예측 AI 챗봇 서비스 'Yummy' 데이터베이스 스키마
-- 작성 기준: 상용화 및 계정 관리 시스템(Auth) 반영

-- 1. 그룹 테이블 (기관 하위 반 정보)
CREATE TABLE IF NOT EXISTS Groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '그룹명',
    institution_id INT NOT NULL COMMENT '소속 기관(강사) ID',
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    INDEX idx_group_institution (institution_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 사용자 테이블 (학생, 기관, 강사)
CREATE TABLE IF NOT EXISTS Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login_id VARCHAR(50) NOT NULL UNIQUE COMMENT '로그인용 유저 ID',
    password VARCHAR(255) NOT NULL COMMENT '해싱된 비밀번호',
    username VARCHAR(50) NOT NULL COMMENT '실제 성명',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '이메일 주소',
    role ENUM('student', 'institution', 'instructor') DEFAULT 'student' COMMENT '역할 구분',
    status ENUM('active', 'dropout', 'graduated') DEFAULT 'active' COMMENT '현재 상태',
    organization_name VARCHAR(100) COMMENT '소속 기관명 (기관 회원가입 시 필수)',
    institution_id INT COMMENT '소속 기관 ID (수강생 전용)',
    group_id INT COMMENT '소속 그룹 ID (수강생 전용)',
    cohort_id INT COMMENT '기수 정보 (수강생 전용)',
    admission_score DECIMAL(5, 2) COMMENT '입학 성적 (이탈 예측 변수)',
    
    -- 개인정보 동의 관련 (상용화 필수 요건)
    privacy_consent BOOLEAN DEFAULT FALSE COMMENT '개인정보 수집 및 이용 동의 여부',
    third_party_consent BOOLEAN DEFAULT FALSE COMMENT '제3자 제공 동의 여부',
    
    -- 유리병 및 배지 시스템 필드 추가
    current_candy_count INT DEFAULT 0,
    total_candy_count INT DEFAULT 0,
    attendance_days INT DEFAULT 0,
    
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    INDEX idx_user_institution (institution_id),
    INDEX idx_user_group (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 데일리 리플렉션 (학생의 일기/회고 기록)
CREATE TABLE IF NOT EXISTS Reflections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    original_text TEXT NOT NULL,
    gpt_summary TEXT,
    delay_minutes INT DEFAULT 0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    CONSTRAINT fk_reflection_user FOREIGN KEY (UserId) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_reflection_user_date (UserId, createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 감정 로그 (KcELECTRA 기반 감정 분석 결과)
CREATE TABLE IF NOT EXISTS EmotionLogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ReflectionId INT NOT NULL,
    happy_prob DECIMAL(5, 4),
    sad_prob DECIMAL(5, 4),
    angry_prob DECIMAL(5, 4),
    heartache_prob DECIMAL(5, 4),
    anxious_prob DECIMAL(5, 4),
    embarrassed_prob DECIMAL(5, 4),
    dominant_emotion VARCHAR(20),
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    CONSTRAINT fk_emotion_reflection FOREIGN KEY (ReflectionId) REFERENCES Reflections(id) ON DELETE CASCADE,
    INDEX idx_emotion_created (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. 위험도 지표 (EMA 및 XGBoost 기반 이탈 예측 데이터)
CREATE TABLE IF NOT EXISTS RiskMetrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    daily_ers DECIMAL(6, 4),
    cumulative_cer DECIMAL(6, 4),
    dropout_prob DECIMAL(5, 4),
    is_alert BOOLEAN DEFAULT FALSE,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    CONSTRAINT fk_risk_user FOREIGN KEY (UserId) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_risk_user_date (UserId, createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. 챗봇 개입 및 상담 로그
CREATE TABLE IF NOT EXISTS Interventions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    trigger_reason VARCHAR(100),
    chatbot_transcript JSON,
    is_resolved BOOLEAN DEFAULT FALSE,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    CONSTRAINT fk_intervention_user FOREIGN KEY (UserId) REFERENCES Users(id) ON DELETE CASCADE,
    INDEX idx_intervention_user_date (UserId, createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
