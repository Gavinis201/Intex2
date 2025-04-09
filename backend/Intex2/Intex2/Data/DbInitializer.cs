using System;
using System.IO;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Intex2.Models;

public static class DbInitializer
{
    public static IHost InitializeDatabase(this IHost host)
    {
        using (var scope = host.Services.CreateScope())
        {
            var services = scope.ServiceProvider;
            try
            {
                var context = services.GetRequiredService<MoviesDBContext>();
                
                // First check if the AspNetRoles table exists
                var connection = (SqliteConnection)context.Database.GetDbConnection();
                if (connection.State != System.Data.ConnectionState.Open)
                {
                    connection.Open();
                }

                bool aspNetRolesExists = false;
                using (var cmd = connection.CreateCommand())
                {
                    cmd.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name='AspNetRoles';";
                    using (var reader = cmd.ExecuteReader())
                    {
                        aspNetRolesExists = reader.HasRows;
                    }
                }

                if (!aspNetRolesExists)
                {
                    Console.WriteLine("Identity tables do not exist. Creating them now...");
                    
                    // Get the path to the SQL script
                    string scriptPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "CreateIdentityTables.sql");
                    
                    // If the file doesn't exist in the expected location, try to find it relative to the current directory
                    if (!File.Exists(scriptPath))
                    {
                        scriptPath = "Data/CreateIdentityTables.sql";
                        
                        // If still not found, try one directory up
                        if (!File.Exists(scriptPath))
                        {
                            scriptPath = "../Data/CreateIdentityTables.sql";
                        }
                    }
                    
                    if (File.Exists(scriptPath))
                    {
                        Console.WriteLine($"Found SQL script at: {scriptPath}");
                        string sqlScript = File.ReadAllText(scriptPath);
                        
                        using var command = connection.CreateCommand();
                        command.CommandText = sqlScript;
                        command.ExecuteNonQuery();
                        
                        Console.WriteLine("Identity tables created successfully.");
                    }
                    else
                    {
                        Console.WriteLine($"Could not find the SQL script file. Looked in: {scriptPath}");
                        
                        // As a fallback, create the tables directly if we can't find the script
                        Console.WriteLine("Creating Identity tables directly with inline SQL...");
                        
                        using (var cmd = connection.CreateCommand())
                        {
                            cmd.CommandText = @"
-- Create AspNetRoles table if it doesn't exist
CREATE TABLE IF NOT EXISTS ""AspNetRoles"" (
    ""Id"" TEXT NOT NULL PRIMARY KEY,
    ""Name"" TEXT NULL,
    ""NormalizedName"" TEXT NULL,
    ""ConcurrencyStamp"" TEXT NULL
);

-- Create AspNetUsers table if it doesn't exist
CREATE TABLE IF NOT EXISTS ""AspNetUsers"" (
    ""Id"" TEXT NOT NULL PRIMARY KEY,
    ""MoviesUserId"" INTEGER NULL,
    ""UserName"" TEXT NULL,
    ""NormalizedUserName"" TEXT NULL,
    ""Email"" TEXT NULL,
    ""NormalizedEmail"" TEXT NULL,
    ""EmailConfirmed"" INTEGER NOT NULL,
    ""PasswordHash"" TEXT NULL,
    ""SecurityStamp"" TEXT NULL,
    ""ConcurrencyStamp"" TEXT NULL,
    ""PhoneNumber"" TEXT NULL,
    ""PhoneNumberConfirmed"" INTEGER NOT NULL,
    ""TwoFactorEnabled"" INTEGER NOT NULL,
    ""LockoutEnd"" TEXT NULL,
    ""LockoutEnabled"" INTEGER NOT NULL,
    ""AccessFailedCount"" INTEGER NOT NULL
);

-- Create AspNetRoleClaims table if it doesn't exist
CREATE TABLE IF NOT EXISTS ""AspNetRoleClaims"" (
    ""Id"" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    ""RoleId"" TEXT NOT NULL,
    ""ClaimType"" TEXT NULL,
    ""ClaimValue"" TEXT NULL,
    CONSTRAINT ""FK_AspNetRoleClaims_AspNetRoles_RoleId"" FOREIGN KEY (""RoleId"") REFERENCES ""AspNetRoles"" (""Id"") ON DELETE CASCADE
);

-- Create AspNetUserClaims table if it doesn't exist
CREATE TABLE IF NOT EXISTS ""AspNetUserClaims"" (
    ""Id"" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    ""UserId"" TEXT NOT NULL,
    ""ClaimType"" TEXT NULL,
    ""ClaimValue"" TEXT NULL,
    CONSTRAINT ""FK_AspNetUserClaims_AspNetUsers_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""AspNetUsers"" (""Id"") ON DELETE CASCADE
);

-- Create AspNetUserLogins table if it doesn't exist
CREATE TABLE IF NOT EXISTS ""AspNetUserLogins"" (
    ""LoginProvider"" TEXT NOT NULL,
    ""ProviderKey"" TEXT NOT NULL,
    ""ProviderDisplayName"" TEXT NULL,
    ""UserId"" TEXT NOT NULL,
    CONSTRAINT ""PK_AspNetUserLogins"" PRIMARY KEY (""LoginProvider"", ""ProviderKey""),
    CONSTRAINT ""FK_AspNetUserLogins_AspNetUsers_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""AspNetUsers"" (""Id"") ON DELETE CASCADE
);

-- Create AspNetUserRoles table if it doesn't exist
CREATE TABLE IF NOT EXISTS ""AspNetUserRoles"" (
    ""UserId"" TEXT NOT NULL,
    ""RoleId"" TEXT NOT NULL,
    CONSTRAINT ""PK_AspNetUserRoles"" PRIMARY KEY (""UserId"", ""RoleId""),
    CONSTRAINT ""FK_AspNetUserRoles_AspNetRoles_RoleId"" FOREIGN KEY (""RoleId"") REFERENCES ""AspNetRoles"" (""Id"") ON DELETE CASCADE,
    CONSTRAINT ""FK_AspNetUserRoles_AspNetUsers_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""AspNetUsers"" (""Id"") ON DELETE CASCADE
);

-- Create AspNetUserTokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS ""AspNetUserTokens"" (
    ""UserId"" TEXT NOT NULL,
    ""LoginProvider"" TEXT NOT NULL,
    ""Name"" TEXT NOT NULL,
    ""Value"" TEXT NULL,
    CONSTRAINT ""PK_AspNetUserTokens"" PRIMARY KEY (""UserId"", ""LoginProvider"", ""Name""),
    CONSTRAINT ""FK_AspNetUserTokens_AspNetUsers_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""AspNetUsers"" (""Id"") ON DELETE CASCADE
);

-- Create indexes for AspNetRoles
CREATE INDEX IF NOT EXISTS ""IX_AspNetRoles_NormalizedName"" ON ""AspNetRoles"" (""NormalizedName"");

-- Create indexes for AspNetUsers
CREATE INDEX IF NOT EXISTS ""IX_AspNetUsers_NormalizedUserName"" ON ""AspNetUsers"" (""NormalizedUserName"");
CREATE INDEX IF NOT EXISTS ""IX_AspNetUsers_NormalizedEmail"" ON ""AspNetUsers"" (""NormalizedEmail"");
CREATE INDEX IF NOT EXISTS ""IX_AspNetUsers_MoviesUserId"" ON ""AspNetUsers"" (""MoviesUserId"");

-- Create indexes for AspNetRoleClaims
CREATE INDEX IF NOT EXISTS ""IX_AspNetRoleClaims_RoleId"" ON ""AspNetRoleClaims"" (""RoleId"");

-- Create indexes for AspNetUserClaims
CREATE INDEX IF NOT EXISTS ""IX_AspNetUserClaims_UserId"" ON ""AspNetUserClaims"" (""UserId"");

-- Create indexes for AspNetUserLogins
CREATE INDEX IF NOT EXISTS ""IX_AspNetUserLogins_UserId"" ON ""AspNetUserLogins"" (""UserId"");

-- Create indexes for AspNetUserRoles
CREATE INDEX IF NOT EXISTS ""IX_AspNetUserRoles_RoleId"" ON ""AspNetUserRoles"" (""RoleId"");

-- Insert default roles
INSERT OR IGNORE INTO ""AspNetRoles"" (""Id"", ""Name"", ""NormalizedName"", ""ConcurrencyStamp"")
VALUES 
('1', 'Administrator', 'ADMINISTRATOR', null),
('2', 'User', 'USER', null),
('3', 'admin', 'ADMIN', null);
";
                            cmd.ExecuteNonQuery();
                            Console.WriteLine("Identity tables created successfully with inline SQL.");
                        }
                    }
                }
                else
                {
                    Console.WriteLine("Identity tables already exist.");
                }

                Console.WriteLine("Database initialization complete");
            }
            catch (Exception ex)
            {
                Console.WriteLine("An error occurred while initializing the database: " + ex.Message);
                if (ex.InnerException != null)
                {
                    Console.WriteLine("Inner exception: " + ex.InnerException.Message);
                }
                Console.WriteLine(ex.StackTrace);
            }
        }
        
        return host;
    }
} 