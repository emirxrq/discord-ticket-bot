const express = require("express");
const app = express();
require("dotenv").config();
const path = require("path");
const port = process.env.PORT || 3000;
require("ejs");
const { connectDb } = require("./db");
let db;
(async () => {
    db = await connectDb();
})();

app.use(express.static(path.join(__dirname, 'views')));

app.set('view engine', 'ejs');

app.get('/:archiveId', (req, res) => {
    const archiveId = req.params.archiveId;
    db.collection('tickets').findOne({ archiveId: archiveId })
        .then((ticket) => {
            if (ticket) {
                console.log(ticket);

                if (ticket.status !== "closed")
                {
                    return res.send("Since this ticket is not closed, the archive cannot be viewed.");
                }
                db.collection('messages').find({ channelId: ticket.channelId }).toArray()
                    .then((messages) => {
                        res.render('index', { messages: messages, ticket: ticket });
                    })
                    .catch(err => {
                        res.send("Error while trying to view archive: " + err);
                    })
            }
            else {
                res.send("No such archive was found. It may have been deleted...");
            }
        })
        .catch((err) => {
            console.log(err);
        });

});

app.listen(port, () => console.log(`The server is running on ${port}.`));