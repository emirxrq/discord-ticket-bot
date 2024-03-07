const config = {
    token: "botToken",
    sunucuId: "1196712186232438814",
    prefix: "/",
    database: {
        uri: "", //Example: mongodb://localhost:<port>/<dbname>
    },
    ticket: {
        notAuthorizedMessages: {
            deleteTicket: "You cannot close this support room if you are not a support representative."
        },
        categoryId: "1210279188410404936",
        archiveCategoryId: "1211762178244218990",
        channelsNameStartsWith: "ticket-",
        staffId: "1204478522056507433",
        embedDescription: "Your request has been created successfully. Our officials will get back to you as soon as possible. To close the request, click the ``Close`` button or type ``/close``.",
        setup: "setup",
        close: "close",
        delete: "delete",
        reopen: "reopen",
        allDelete: "deleteAll",
        anotherThing: "another",
        ticketEmbed: {
            color: 0x347ff7,
            title: "STALLER SOFTWARE SUPPORT",
            authorName: "emir",
            description: "``If you need support, you can create a request by selecting a category from the section below.``",
            thumbnail: `https://media.discordapp.net/attachments/1203471545247342602/1215321316308295680/eski.png?ex=65fc532d&is=65e9de2d&hm=4c0b06a222ce78cf51f406b0ef494107d1a85929d2eafc8744eaf9242e60db7d&=&format=webp&quality=lossless`,
            fields: {
                field1: {
                    name: ":calendar_spiral: Working hours:",
                    weekday: {
                        hour: "16:00-23:00"
                    },
                    saturday: {
                        hour: "12:00-23.00"
                    },
                    warning: "Requests made outside working hours may be postponed to the next business day or our return may be delayed."
                },
                field2: {
                    name: ":mailbox: Ticket Details: ",
                    value: "Support requests are answered respectively according to working hours and availability. Tagging will result in a warning and subsequent muting."
                },
                field3: {
                    name: ":closed_book: Product details",
                    value: "All current information about our products is available on https://example.com."
                }
            },
            footerText: "Staller Software | Copyright © 2024 All Rights Reserved."
        },
        ticketTopics: [
            {
                label: "⏰ Pre-Sales Support",
                description: "Satın alım yapmadan önce buradan bilgi alabilirsiniz.",
                value: "satış öncesi"
            },
            {
                label: "⚙️ Technical support",
                description: "You can get support regarding our products here.",
                value: "teknik destek"
            },
            {
                label: "💎 Other",
                description: "You can get support here other than the above topics.",
                value: "diğer"
            }
        ],
        ticketModal: {
            title: "STALLER SOFTWARE SUPPORT"
        }
    }
}

module.exports = config;