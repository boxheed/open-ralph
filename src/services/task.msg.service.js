/**
 * Derives a conventional commit message from a task object.
 * 
 * @param {object} task - The task object containing fileName, data (frontmatter), and content.
 * @returns {string} The formatted commit message.
 */
function deriveCommitMessage(task) {
    const type = deriveType(task.fileName);
    const scope = task.data?.task_id;
    const subject = deriveSubject(task);

    const scopePart = scope ? `(${scope})` : '';
    return `${type}${scopePart}: ${subject}`;
}

function deriveType(fileName) {

    const parts = fileName.toUpperCase().split('-');

    if (parts.length < 2) return 'feat';

    

    const typePart = parts[1];

    if (typePart === 'FIX' || typePart === 'BUG') return 'fix';

    if (typePart === 'TEST') return 'test';

    if (typePart === 'DOCS') return 'docs';

    return 'feat';

}



function deriveSubject(task) {

    let subject = '';



    // 1. Objective Section

    const objectiveMatch = task.content.match(/# Objective\s+([^\n]+)/i);

    if (objectiveMatch && objectiveMatch[1]) {

        subject = objectiveMatch[1].trim();

    }



    // 2. First H1

    if (!subject) {

        const h1Match = task.content.match(/^#\s+([^\n]+)/m);

        if (h1Match && h1Match[1]) {

            subject = h1Match[1].trim();

        }

    }



    // 3. Filename Fallback

    if (!subject) {

        subject = humanizeFilename(task.fileName);

    }



    return truncateSubject(subject);

}



function humanizeFilename(fileName) {

    // Remove extension

    let name = fileName.replace(/\.md$/, '');

    

    // Split by hyphens

    const parts = name.split('-');

    

    // If it follows NNNN-TYPE-description, skip first two parts

    if (parts.length >= 3 && /^\d+$/.test(parts[0])) {

        return parts.slice(2).join(' ');

    }

    

    return name.replace(/-/g, ' ');

}

function truncateSubject(subject) {
    if (subject.length <= 72) return subject;
    return subject.substring(0, 72) + '...';
}

module.exports = { deriveCommitMessage };
