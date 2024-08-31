const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Chat = sequelize.define(
    "Chat",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: "created_at",
      },
      chat_messages: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: "chats",
      timestamps: false,
    }
  );

  return Chat;
};
