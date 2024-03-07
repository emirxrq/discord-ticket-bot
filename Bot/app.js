const { Client, GatewayIntentBits, Message, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, GuildChannel, ChannelType, PermissionFlags, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder } = require("discord.js");
const config = require('./botConfig');
const { connectDB } = require("./db");
const crypto = require("crypto");
let db;
(async () => {
    db = await connectDB();
})();

const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildEmojisAndStickers
    ]
});
const { DateTime } = require("luxon");

client.on('ready', () => console.log("The bot entered the server."));

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.split(' ');
    const command = args[0];
    const sendMessageContent = args.slice(1).join(' ');


    if (message.content == config.prefix + config.ticket.setup) {
        if (message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const ticketEmbed = new EmbedBuilder()
                .setColor(config.ticket.ticketEmbed.color)
                .setTitle(config.ticket.ticketEmbed.title)
                .setThumbnail(config.ticket.ticketEmbed.thumbnail)
                .setDescription(config.ticket.ticketEmbed.description)
                .addFields(
                    {
                        name: "\n", value: "\n"
                    }
                )
                .addFields(
                    {
                        name: config.ticket.ticketEmbed.fields.field1.name,
                        value:
                            "``-`` Weekday: " + config.ticket.ticketEmbed.fields.field1.weekday.hour + "\n" +
                            "``-`` Weekend: " + config.ticket.ticketEmbed.fields.field1.saturday.hour + "\n" +
                            config.ticket.ticketEmbed.fields.field1.warning
                    }
                )
                .addFields(
                    {
                        name: "\n", value: "\n"
                    }
                )
                .addFields(
                    {
                        name: config.ticket.ticketEmbed.fields.field2.name,
                        value: config.ticket.ticketEmbed.fields.field2.value
                    }
                )
                .addFields(
                    {
                        name: "\n", value: "\n"
                    }
                )
                .addFields(
                    {
                        name: config.ticket.ticketEmbed.fields.field3.name,
                        value: config.ticket.ticketEmbed.fields.field3.value
                    }
                )
                .addFields(
                    {
                        name: "\n", value: "\n"
                    }
                )
                .setFooter({ text: config.ticket.ticketEmbed.footerText });

            const selectTopicMenu = new SelectMenuBuilder()
                .setCustomId('selectTopicMenu')
                .setPlaceholder('Please choose a topic')
                .addOptions([
                    ...config.ticket.ticketTopics
                ]);

            const row1 = new ActionRowBuilder().addComponents(selectTopicMenu);
            message.channel.send({ embeds: [ticketEmbed], components: [row1] });
        }
    }

    if (message.content == config.prefix + config.ticket.close) {
        const channel = message.guild.channels.cache.get(message.channel.id);
        if (!channel && channel.type !== ChannelType.GuildText) {
            return message.reply("The channel was not found or is not of the Post Channel type.");
        }

        const category = message.guild.channels.cache.get(config.ticket.archiveCategoryId);
        if (!category && channel.type !== ChannelType.GuildCategory) {
            return message.reply("Category not found or not of Category type.");
        }

        await channel.setParent(category)
            .then(async () => {
                await channel.permissionOverwrites.set([
                    {
                        id: message.guild.roles.everyone,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: message.guild.roles.cache.get(config.ticket.staffId),
                        allow: [PermissionFlagsBits.ViewChannel] //
                    }
                ])
                    .then(async () => {
                        await db.collection('tickets').updateOne(
                            { channelId: channel.id },
                            { $set: { status: "closed" } }
                        ).then(async () => {
                            await db.collection('tickets').findOne({ channelId: channel.id })
                                .then(async (ticket) => {
                                    const embedMsg = new EmbedBuilder()
                                        .setColor(config.ticket.ticketEmbed.color)
                                        .setThumbnail(config.ticket.ticketEmbed.thumbnail)
                                        .setTitle(`Support request closed.`)
                                        .setDescription(`This ticket was closed by <@${message.member.id}>.`)
                                        .addFields({ name: "\n", value: "\n" })
                                        .addFields({ name: "Open by", value: `<@${ticket.owner}> - (${ticket.owner})` })
                                        .addFields({ name: "Closed by", value: `<@${message.member.id}> - (${message.member.id})` })
                                        .addFields({ name: "Channel", value: `#${ticket.channelName} - (${ticket.channelId})` })
                                        .addFields({ name: "Archive", value: `[View archive](http://localhost:6525/${ticket.archiveId})` })
                                        .addFields({ name: "Tarih", value: new Date(message.createdTimestamp).toLocaleString() })
                                        .setFooter({ text: config.ticket.ticketEmbed.footerText });

                                    await message.member.send({ embeds: [embedMsg] });
                                    await message.channel.send(`:x: This channel has been closed by <@${message.author.id}>.`);


                                })
                                .catch(err => {

                                });

                        });
                    });
            })
            .catch((err) => {
                return message.reply("Failed to close channel: " + err);
            });
    }

    if (message.content == config.prefix + config.ticket.reopen) {
        const channel = message.guild.channels.cache.get(message.channel.id);

        if (!channel && channel.type !== ChannelType.GuildText) {
            return message.reply("Channel not found or not in Post type.");
        }

        const category = message.guild.channels.cache.get(config.ticket.categoryId);

        if (channel.parentId !== config.ticket.archiveCategoryId) {
            return message.reply("This channel is already open. It is not in the archive category either.");
        }

        if (!message.member.roles.cache.has(config.ticket.staffId)) {
            return message.reply("You do not have the authority to reopen the ticket.");
        }

        await channel.setParent(category)
            .then(async () => {
                await db.collection('tickets').findOne({ channelId: channel.id })
                    .then(async (room) => {
                        const ownerId = room.owner;
                        console.log(ownerId);
                        await channel.permissionOverwrites.set([
                            {
                                id: message.guild.roles.everyone,
                                deny: [PermissionFlagsBits.ViewChannel]
                            },
                            {
                                id: ownerId,
                                allow: [PermissionFlagsBits.ViewChannel]
                            },
                            {
                                id: config.ticket.staffId,
                                allow: [PermissionFlagsBits.ViewChannel]
                            }
                        ]).then(async () => {
                            await db.collection('tickets').updateOne(
                                { channelId: channel.id },
                                { $set: { status: "open" } }
                            )
                                .then((results) => {
                                    channel.send(`:recycle: This request has been reopened by <@${message.author.id}>!`);
                                });
                        })
                    })
                    .catch(err => {
                        return message.reply("An error occurred while retrieving Channel Owner Id! " + err);
                    });
            })
            .catch(err => {
                return message.reply("An error occurred while reopening the channel.");
            });
    }

    if (message.content == config.prefix + config.ticket.delete) {
        if (!message.member.roles.cache.has(config.ticket.staffId)) {
            return message.reply(config.ticket.notAuthorizedMessages.deleteTicket);
        }
        const channelId = message.channel.id;
        if (!message.member.roles.cache.has(config.ticket.staffId)) {
            return message.reply("You do not have permission to delete the ticket.");
        }
        message.channel.delete()
            .then(async () => {
                await db.collection('tickets').deleteOne({ channelId: channelId })
                    .then(async (results) => {
                        await db.collection('messages').deleteMany({ channelId: channelId });
                    })
            })
            .catch((err) => {
                console.log("Error while deleting channel: " + err);
            });
    }

    if (message.content == config.prefix + config.ticket.allDelete) {
        const guildChannels = message.guild.channels.cache;
        if (!message.member.roles.cache.has(config.ticket.staffId)) {
            return message.reply("You do not have permission to delete all tickets.");
        }
        guildChannels.forEach(async (channel) => {
            if (channel.name.startsWith(config.ticket.channelsNameStartsWith)) {
                await channel.delete();
            }
        });
        await db.collection('tickets').deleteMany({})
            .then(async () => {
                await db.collection('messages').deleteMany({});
            })
    }

    if (message.content == config.prefix + config.ticket.anotherThing) {
        message.channel.send(`If you don't have any other problems, I'm closing the request. <@${message.author.id}>`)
    }

    if (message.channel.parentId === config.ticket.categoryId && message.channel.name.startsWith(config.ticket.channelsNameStartsWith)) {
        if (message.attachments.size > 0) {
            message.attachments.forEach(async attachment => {
                const imageURL = attachment.url;
                try {
                    if (message.member.roles.cache.has(config.ticket.staffId)) {
                        await db.collection('messages').insertOne({
                            channelId: message.channel.id,
                            imageURL: imageURL,
                            author: message.author.username,
                            authorId: message.author.id,
                            role: "staff",
                            timestamp: message.createdAt.toLocaleString(),
                            messageType: "attachment",

                        });
                    }
                    else {
                        await db.collection('messages').insertOne({
                            channelId: message.channel.id,
                            imageURL: imageURL,
                            author: message.author.username,
                            authorId: message.author.id,
                            role: "member",
                            timestamp: message.createdAt.toLocaleString(),
                            messageType: "attachment",

                        });
                    }
                } catch (err) {
                    console.error('An error occurred while adding the image:', err);
                }
            });
        }
        else {
            (async () => {
                if (message.member.roles.cache.has(config.ticket.staffId)) {
                    await db.collection('messages').insertOne({
                        channelId: message.channel.id,
                        content: message.content,
                        author: message.author.username,
                        authorId: message.author.id,
                        authorAvatar: message.author.displayAvatarURL({ format: 'png', dynamic: true, size: 256 }),
                        role: "staff",
                        messageType: "text",
                        timestamp: message.createdAt.toLocaleString()
                    })
                        .then(() => {
                        })
                        .catch(err => {
                            console.error("An error occurred while adding the message:", err);
                        });
                }
                else {

                    await db.collection("messages").insertOne({
                        channelId: message.channel.id,
                        content: message.content,
                        author: message.author.username,
                        authorId: message.author.id,
                        authorAvatar: message.author.displayAvatarURL({ format: 'png', dynamic: true, size: 256 }),
                        role: "member",
                        timestamp: message.createdAt.toLocaleString()
                    })
                        .then(() => {
                        })
                        .catch(err => {
                            console.error("An error occurred while adding the message:", error);
                        });
                }
            })();
        }
        const messageId = message.id;


    }
});
const selectedTopics = new Map();
client.on('interactionCreate', async interaction => {
    if (interaction.isSelectMenu()) {
        if (interaction.customId === "selectTopicMenu") {
            const selectedTopic = interaction.values[0];
            selectedTopics.set(interaction.user.id, selectedTopic);
            const modal = new ModalBuilder()
                .setCustomId("ticketTopicModal")
                .setTitle(config.ticket.ticketModal.title)
            const topicInput = new TextInputBuilder()
                .setCustomId('productInput')
                .setLabel('What is the product you want to get support for?')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            const topicInput2 = new TextInputBuilder()
                .setCustomId('topicInput')
                .setLabel('What is the subject you want to get support for?')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            const topicInput3 = new TextInputBuilder()
                .setCustomId('topicDetailInput')
                .setLabel('Give details about the issue you want support for.')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(topicInput);
            const secondActionRow = new ActionRowBuilder().addComponents(topicInput2);
            const thirdActionRow = new ActionRowBuilder().addComponents(topicInput3);
            modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
            interaction.selectedTopic = selectedTopic;
            await interaction.showModal(modal, { customId: 'ticketTopicModal', selectedTopic: selectedTopic });
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === "ticketTopicModal") {
            const productInput = interaction.fields.getTextInputValue('productInput');
            const topicInput = interaction.fields.getTextInputValue('topicInput');
            const topicDetailInput = interaction.fields.getTextInputValue('topicDetailInput');
            const selectedTopic = selectedTopics.get(interaction.user.id).toUpperCase();
            selectedTopics.delete(interaction.user.id);


            const channel = await interaction.guild.channels.create({
                name: config.ticket.channelsNameStartsWith + interaction.member.user.username,
                type: ChannelType.GuildText,
                parent: config.ticket.categoryId,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.member.id,
                        allow: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.guild.roles.cache.get(config.ticket.staffId),
                        allow: [PermissionFlagsBits.ViewChannel]
                    }
                ]
            })
                .then(async (channel) => {
                    await db.collection('tickets').insertOne({
                        channelName: channel.name,
                        channelId: channel.id,
                        archiveId: crypto.createHash('sha256').update(channel.id).digest('hex'),
                        status: "open",
                        owner: interaction.member.id,
                        createdAt: channel.createdAt.toLocaleString(),
                        topic: selectedTopic
                    })
                        .then(async () => {
                            const now = DateTime.now().setZone('Europe/Istanbul');

                            const closeBtn = new ButtonBuilder()
                                .setLabel('Close')
                                .setEmoji('❌')
                                .setStyle(ButtonStyle.Secondary)
                                .setCustomId('closeTicketBtn');

                            const deleteBtn = new ButtonBuilder()
                                .setLabel("Delete")
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji('🗑️')
                                .setCustomId('deleteTicketBtn');

                            const buttonsComponent = new ActionRowBuilder().addComponents(closeBtn, deleteBtn);

                            const embedMsg = new EmbedBuilder()
                                .setTitle(config.ticket.ticketEmbed.title)
                                .setDescription(config.ticket.ticketEmbed.description)
                                .setThumbnail(config.ticket.ticketEmbed.thumbnail)
                                .setColor(config.ticket.ticketEmbed.color)
                                .addFields({
                                    name: "\n", value: "\n"
                                })
                                .addFields({
                                    name: ":child: Ticket Owner", value: `<@${interaction.member.user.id}> - ` + "``" + interaction.member.user.id + "``"
                                })
                                .addFields({
                                    name: ":calendar_spiral: Ticket Date", value: now.toFormat('yyyy-LL-dd HH:mm:ss')
                                })
                                .addFields({
                                    name: ":scroll: Reason for Ticket", value: "- *What is the issue you want to get support for?*\n" + "``" + topicInput + "`` \n\n" + "- *Give details about the issue you want support for.* \n" + "``" + topicDetailInput + "``"
                                })
                                .setFooter(config.ticket.ticketEmbed.footerText);

                            channel.send({ embeds: [embedMsg], components: [buttonsComponent] });
                            await interaction.reply({ content: `Ticket created successfully: <#${channel.id}>`, ephemeral: true });
                        })
                        .catch(async err => {
                            return await interaction.reply({ content: "Error creating room: " + err, ephemeral: true });
                        });
                })
                .catch(async err => {
                    return await interaction.reply({ content: "An error occurred while creating a request: " + err, ephemeral: true });
                })

        }

    }

    if (interaction.isButton()) {
        if (interaction.customId === "closeTicketBtn") {
            const channel = interaction.guild.channels.cache.get(interaction.channel.id);
            if (!channel && channel.type !== ChannelType.GuildText) {
                return interaction.reply("The channel was not found or is not of the Post Channel type.");
            }

            const category = interaction.guild.channels.cache.get(config.ticket.archiveCategoryId);
            if (!category && channel.type !== ChannelType.GuildCategory) {
                return interaction.reply("Category not found or not of Category type.");
            }

            await channel.setParent(category)
                .then(async () => {


                    await channel.permissionOverwrites.set([
                        {
                            id: interaction.guild.roles.everyone,
                            deny: [PermissionFlagsBits.ViewChannel]
                        },
                        {
                            id: interaction.guild.roles.cache.get(config.ticket.staffId),
                            allow: [PermissionFlagsBits.ViewChannel] //
                        }
                    ])
                        .then(async () => {
                            await db.collection('tickets').updateOne(
                                { channelId: channel.id },
                                { $set: { status: "closed" } }
                            ).then(async () => {
                                await db.collection('tickets').findOne({ channelId: channel.id })
                                    .then(async (ticket) => {
                                        console.log(new Date(interaction.createdTimestamp).toLocaleString());
                                        const embedMsg = new EmbedBuilder()
                                            .setColor(config.ticket.ticketEmbed.color)
                                            .setThumbnail(config.ticket.ticketEmbed.thumbnail)
                                            .setTitle(`Support request closed.`)
                                            .setDescription(`This ticket was closed by <@${interaction.member.id}>.`)
                                            .addFields({ name: "\n", value: "\n" })
                                            .addFields({ name: "Opened by", value: `<@${ticket.owner}> - (${ticket.owner})` })
                                            .addFields({ name: "Closed by", value: `<@${interaction.member.id}> - (${interaction.member.id})` })
                                            .addFields({ name: "Channel", value: `#${ticket.channelName} - (${ticket.channelId})` })
                                            .addFields({ name: "Archive", value: `[View archive](http://localhost:6525/${ticket.archiveId})` })
                                            .addFields({ name: "Date", value: new Date(interaction.createdTimestamp).toLocaleString() })
                                            .setFooter({ text: config.ticket.ticketEmbed.footerText });

                                        await interaction.member.send({ embeds: [embedMsg] });
                                        return interaction.reply(`:x: This channel has been closed by <@${interaction.member.id}>.`);
                                    })
                                    .catch(err => {

                                    })
                            });
                        });
                })
                .catch((err) => {
                    return interaction.reply("Failed to close channel: " + err + err.stack);
                });
        }
        if (interaction.customId === "deleteTicketBtn") {
            const channel = interaction.guild.channels.cache.get(interaction.channel.id);
            if (!channel && channel.type !== ChannelType.GuildText) {
                return interaction.reply({ content: "Channel not found or not in Post type.", ephemeral: true });
            }
            const channelId = channel.id;
            if (!interaction.member.roles.cache.has(config.ticket.staffId)) {
                return message.reply("You do not have permission to delete the ticket.");
            }
            channel.delete()
                .then(async () => {
                    await db.collection('tickets').deleteOne({ channelId: channelId })
                        .then(async (results) => {
                            await db.collection('messages').deleteMany({ channelId: channelId });
                        })
                })
                .catch((err) => {
                    return interaction.reply({ content: "Error while deleting channel: " + err, ephemeral: true });
                });
        }
    }
});

client.login(config.token);