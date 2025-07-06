document.addEventListener('DOMContentLoaded', () => {

    // --- ЛОГИКА ДЛЯ СТРАНИЦЫ АНКЕТЫ (SURVEY.HTML) ---
    if (document.body.contains(document.getElementById('questionCard'))) {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const questionTitle = document.getElementById('questionTitle');
        const answersContainer = document.getElementById('answersContainer');
        
        // --- ДИНАМИЧЕСКОЕ ДЕРЕВО ВОПРОСОВ ---
        const questionTree = {
            'start': {
                text: "Кто обращается за поддержкой?",
                answers: [
                    { text: "Я — участник СВО", value: "uchastnik", next: 'q_uchastnik_status' },
                    { text: "Я — член семьи участника СВО", value: "semya", next: 'q_semya_kinship' }
                ]
            },
            'q_uchastnik_status': {
                text: "Укажите ваш текущий статус:",
                answers: [
                    { text: "Прохожу службу (действующий)", value: "active", next: 'q_deti' },
                    { text: "Получил удостоверение ветерана БД", value: "veteran", next: 'q_deti' },
                    { text: "Получил инвалидность вследствие ранения", value: "invalid", next: 'q_deti' }
                ]
            },
            'q_semya_kinship': {
                text: "Кем вы приходитесь участнику СВО?",
                answers: [
                    { text: "Супруга / Супруг", value: "suprug", next: 'q_semya_status' },
                    { text: "Ребенок", value: "rebenok", next: 'q_semya_status' },
                    { text: "Родитель", value: "roditel", next: 'q_semya_status' }
                ]
            },
            'q_semya_status': {
                text: "Какой статус у участника СВО сейчас?",
                answers: [
                    { text: "Проходит службу", value: "active", next: 'q_deti' },
                    { text: "Погиб (умер)", value: "pogib", next: 'q_deti' },
                    { text: "Вернулся (ветеран/инвалид)", value: "veteran", next: 'q_deti' }
                ]
            },
            'q_deti': {
                text: "Есть ли в семье несовершеннолетние дети?",
                answers: [
                    { text: "Да, есть", value: "deti_yes", next: null }, // Конец опроса
                    { text: "Нет", value: "deti_no", next: null }      // Конец опроса
                ]
            }
        };

        const userAnswers = {};
        let currentQuestionId = 'start';
        let questionHistory = ['start'];

        function renderQuestion(questionId) {
            const question = questionTree[questionId];
            
            const progress = (questionHistory.length / (Object.keys(questionTree).length -1)) * 100; // Примерный прогресс
            progressBar.style.width = `${progress > 100 ? 100 : progress}%`;
            progressText.textContent = `Шаг ${questionHistory.length}`;

            questionTitle.textContent = question.text;
            answersContainer.innerHTML = '';

            question.answers.forEach(answer => {
                const button = document.createElement('button');
                button.className = 'answer-button';
                button.textContent = answer.text;
                button.onclick = () => {
                    // Сохраняем и id вопроса, и значение ответа
                    userAnswers[questionId] = answer.value; 
                    
                    if (answer.next) {
                        currentQuestionId = answer.next;
                        questionHistory.push(currentQuestionId);
                        renderQuestion(currentQuestionId);
                    } else {
                        // Это последний вопрос ветки
                        finalizeSurvey();
                    }
                };
                answersContainer.appendChild(button);
            });
        }

        function finalizeSurvey() {
            progressBar.style.width = `100%`;
            progressText.textContent = `Готово!`;
            questionTitle.textContent = "Спасибо! Анализируем ваши ответы и готовим персональный список...";
            answersContainer.innerHTML = '';

            const queryParams = new URLSearchParams(userAnswers).toString();
            setTimeout(() => {
                window.location.href = `results.html?${queryParams}`;
            }, 2000);
        }
        
        renderQuestion(currentQuestionId);
    }

    // --- ЛОГИКА ДЛЯ СТРАНИЦЫ РЕЗУЛЬТАТОВ (RESULTS.HTML) ---
    if (document.body.contains(document.getElementById('resultsGrid'))) {
        const resultsGrid = document.getElementById('resultsGrid');
        const params = new URLSearchParams(window.location.search);

        // Улучшенная база мер поддержки с более сложными условиями
        const allMeasures = [
            { 
                title: "Компенсация 50% расходов на оплату ЖКУ", 
                description: "Предоставляется участникам СВО и членам их семей, проживающим совместно.",
                check: (p) => p.get('start') === 'uchastnik' || p.get('start') === 'semya',
                where: "Отдел соцзащиты, МФЦ",
                docs: ["Паспорт", "Справка из военкомата / удостоверение ВБД", "Документы о родстве"]
            },
            { 
                title: "Единовременная выплата при ранении", 
                description: "Федеральная выплата в размере 3 млн. рублей.",
                check: (p) => p.get('start') === 'uchastnik' && p.get('q_uchastnik_status') === 'invalid',
                where: "Воинская часть, военкомат",
                docs: ["Заявление", "Справка о ранении (форма 100)"]
            },
            { 
                title: "Первоочередное зачисление детей в детские сады и школы", 
                description: "Дети участников СВО имеют приоритетное право на зачисление.",
                check: (p) => p.get('q_deti') === 'deti_yes',
                where: "Отдел образования по месту жительства",
                docs: ["Паспорт родителя", "Свидетельство о рождении ребенка", "Справка из военкомата"]
            },
            { 
                title: "Выплата семье в случае гибели военнослужащего", 
                description: "Единовременная выплата семье погибшего участника СВО.",
                check: (p) => p.get('start') === 'semya' && p.get('q_semya_status') === 'pogib',
                where: "Военкомат, Социальный фонд",
                docs: ["Свидетельство о смерти", "Документы о родстве"]
            }
        ];
        
        // Фильтруем меры на основе функции check
        const appropriateMeasures = allMeasures.filter(measure => measure.check(params));

        resultsGrid.innerHTML = '';

        if (appropriateMeasures.length > 0) {
            appropriateMeasures.forEach(measure => {
                const card = document.createElement('div');
                card.className = 'result-card';
                card.innerHTML = `
                    <h3>${measure.title}</h3>
                    <p>${measure.description}</p>
                    <div class="result-card-footer">
                        <strong>Куда обращаться:</strong> ${measure.where}<br>
                        <strong>Основные документы:</strong>
                        <ul>
                            ${measure.docs.map(doc => `<li>${doc}</li>`).join('')}
                        </ul>
                    </div>
                `;
                resultsGrid.appendChild(card);
            });
        } else {
            resultsGrid.innerHTML = '<div class="placeholder">На основе ваших ответов подходящих мер не найдено. Это может быть особенностью прототипа. Для полной консультации обратитесь в МФЦ или фонд "Защитники Отечества".</div>';
        }
    }
});