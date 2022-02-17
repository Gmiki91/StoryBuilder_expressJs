exports.numToString = (rate) => {
    if (rate < 1.5) return 'A';
    if (rate >= 1.5 && rate < 2.5) return 'A+';
    if (rate >= 2.5 && rate < 3.5) return 'B';
    if (rate >= 3.5 && rate < 4.5) return 'B+';
    if (rate >= 4.5 && rate < 5.5) return 'C';
    if (rate >= 5.5) return 'N';
}

exports.stringToNum = (rate) => {
    switch (rate) {
        case 'A': return 1;
        case 'A+': return 2;
        case 'B': return 3;
        case 'B+': return 4;
        case 'C': return 5;
        case 'N': return 6;
        default: return '?';
    }
}

exports.getTextByCode = (code) => {
    switch (code) {
        case 'A': return 'Beginner'
        case 'A+': return 'Lower-intermediate'
        case 'B': return 'Intermediate'
        case 'B+': return 'Upper-intermediate'
        case 'C': return 'Advanced'
        case 'N': return 'Native'
        default: return '?'
    }
}