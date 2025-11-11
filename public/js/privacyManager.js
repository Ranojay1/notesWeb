class PrivacyManager {
    constructor(currentPage) {
        this.currentPage = currentPage;
        this.privacyOptions = [
            { id: 'public', label: '🌍 Públicas', href: '/public' },
            { id: 'friends', label: '👥 Amigos', href: '/friendNotes' },
            { id: 'private', label: '🔒 Privadas', href: '/myNotes' }
        ];
    }

    render() {
        return `
            <div class="privacy-selector">
                <div class="privacy-label">Privacidad de notas:</div>
                <div class="privacy-buttons">
                    ${this.privacyOptions.map(option => `
                        <a href="${option.href}" class="privacy-btn ${this.currentPage === option.id ? 'active' : ''}">
                            ${option.label}
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }
}
