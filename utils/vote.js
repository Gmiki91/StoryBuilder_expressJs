const saveVote = async(userId, vote,obj) =>{
    const originalVote = obj.ratings.find(rate => rate.userId === userId.toString());
    if (vote === 0) { // there was a previous vote which has been cancelled
        const index = obj.ratings.indexOf(originalVote);
        obj.ratings.splice(index, 1);
    } else if (Math.abs(vote) === 1) { // there was no previous vote
        obj.ratings.push({ userId, rate: vote })
    } else { // there was a previous vote, the opposite of current vote (Math.abs(vote) === 2)
        originalVote.rate = -originalVote.rate
    }
    await obj.save();
    return obj;
}

module.exports= saveVote;