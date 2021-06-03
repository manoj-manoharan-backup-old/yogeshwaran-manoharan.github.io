const TECH_BLOG = 'tech_blog';

exports.up = function (knex, Promise) {
    return knex.schema.createTable(TECH_BLOG, function (table) {
        table.bigIncrements();
        table.text('title', 'mediumtext');
        table.text('description', 'mediumtext');
        table.text('link', 'mediumtext');
        table.string('link_hash', 64).notNullable().unique();
        table.string('owner');
        table.string('published_date');
        table.timestamp('article_created_at');
    })
};

exports.down = function (knex, Promise) {
    return knex.schema.dropTable(TECH_BLOG);
};