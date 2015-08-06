

exports.connect = function (req, res)
{
    res.render('room', { user : req.session.user });
}