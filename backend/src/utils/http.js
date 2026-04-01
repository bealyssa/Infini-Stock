function ok(res, data, status = 200) {
    return res.status(status).json(data)
}

function badRequest(res, message) {
    return res.status(400).json({ message })
}

function serverError(res, message = 'Internal server error') {
    return res.status(500).json({ message })
}

module.exports = {
    ok,
    badRequest,
    serverError,
}
