const handleAddQuestionModal = () => {

    const modal = document.getElementById('addQuestionModal');
    if (modal) {
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    }
}
