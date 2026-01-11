import { getScripts } from "../services/rscripts.js";
import { translate } from "../services/translate.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from "discord.js";

export async function paginatedSearch(message) {
  const query = message.content.replace("!بحث", "").trim();
  if (!query) return message.reply("❌ اكتب اسم الماب بعد الأمر");

  const translated = await translate(query, "auto", "en");
  const data = await getScripts();

  let scripts = data.scripts.filter(s =>
    s.title.toLowerCase().includes(translated.toLowerCase()) ||
    s.description.toLowerCase().includes(translated.toLowerCase())
  );

  if (!scripts.length) return message.reply("❌ لا توجد نتائج");

  scripts = scripts.slice(0, 15);
  let index = 0;

  const buildEmbed = async () => {
    const s = scripts[index];
    return new EmbedBuilder()
      .setTitle(`🎮 ${s.title}`)
      .setDescription(await translate(s.description, "en", "ar"))
      .setImage(s.image)
      .addFields(
        { name: "🗺️ البحث", value: query, inline: true },
        { name: "👤 الصانع", value: s.creator || "غير معروف", inline: true },
        { name: "🔗 الرابط", value: `https://rscripts.net/script/${s._id}` }
      )
      .setFooter({ text: `سكربت ${index + 1} من ${scripts.length}` });
  };

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("prev").setLabel("⬅️").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("next").setLabel("➡️").setStyle(ButtonStyle.Primary)
  );

  const msg = await message.channel.send({
    embeds: [await buildEmbed()],
    components: [row]
  });

  const collector = msg.createMessageComponentCollector({ time: 300000 });

  collector.on("collect", async i => {
    if (i.user.id !== message.author.id)
      return i.reply({ content: "❌ ليس لك", ephemeral: true });

    index = i.customId === "next"
      ? (index + 1) % scripts.length
      : (index - 1 + scripts.length) % scripts.length;

    await i.update({ embeds: [await buildEmbed()] });
  });
}
