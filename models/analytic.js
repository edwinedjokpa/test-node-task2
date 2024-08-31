const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Analytic = sequelize.define(
    "Analytic",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      create_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      widget_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      browser_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "analytics",
      timestamps: false,
    }
  );

  return Analytic;
};
