
    function selectTopic(btn) {
        document.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('selected-topic').value = btn.textContent.trim().replace(/^[^\w]+/, '');
    }
    function updateCharCount(textarea) {
        document.getElementById('charCount').textContent = textarea.value.length;
    }
    function toggleFAQ(question) {
        const item = question.parentElement;
        const wasOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!wasOpen) item.classList.add('open');
    }
    function handleContact(event) {
        event.preventDefault();
        const fname = document.getElementById('contact-fname').value;
        const topic = document.getElementById('selected-topic').value || 'General inquiry';
        showToast(`✅ Thanks, ${fname}! Your message about "${topic}" has been sent. We'll reply within 24 hours.`);
        event.target.reset();
        document.getElementById('charCount').textContent = '0';
        document.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.topic-btn').classList.add('active');
    }
