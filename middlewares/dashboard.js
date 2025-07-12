const checkUrl = (req,res, next) => {
    let {name} = req.query;
    
    next();
}

module.exports = {checkUrl};