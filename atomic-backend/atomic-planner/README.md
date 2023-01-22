# Atomic Planner

Atomic Planner uses Optaplanner under the hood.

## Instructions

1. Copy over `src` to an [Optlanner](https://github.com/kiegroup/optaplanner-quickstarts/tree/stable/technology/kotlin-quarkus) quickstarts
2. Copy over `pom.xml` to the root of the directory. In other words, in the same directory level as `src` directory.
3. Follow instructions as per the provided link to install and run your own Planner. Go to [Quarkus](https://quarkus.io/) to find more information about different deployment options
4. Planner requires a Postgresql database for storing values
5. Create a new Postgresql database and create a new table `admin_user` 

```
CREATE TABLE admin_user (
  id INT,
  username VARCHAR(255),
  password VARCHAR(255),
  role VARCHAR(255)
);

INSERT INTO admin_user (id, username, password, role) VALUES (1, 'admin', 'YOUR-ADMIN-PASSWORD', 'admin');
```
5. Command `quarkus dev` can be used to create the necessary tables in your db
