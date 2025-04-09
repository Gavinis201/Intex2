using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading.Tasks;
using Intex2.Models;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Intex2.Data
{
    public static class IdentitySeeder
    {
        public static async Task SeedRolesAndAdmin(IServiceProvider serviceProvider)
        {
            try
            {
                var dbContext = serviceProvider.GetRequiredService<MoviesDBContext>();
                
                // Check if the tables exist first
                var connection = (SqliteConnection)dbContext.Database.GetDbConnection();
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
                    Console.WriteLine("AspNetRoles table doesn't exist. Database needs to be initialized before seeding roles.");
                    return;
                }
                
                var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
                var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

                // Ensure the 'admin' role exists
                if (!await roleManager.RoleExistsAsync("admin"))
                {
                    Console.WriteLine("Creating 'admin' role");
                    await roleManager.CreateAsync(new IdentityRole("admin"));
                }
                else
                {
                    Console.WriteLine("'admin' role already exists");
                }

                // Ensure the 'Administrator' role exists
                if (!await roleManager.RoleExistsAsync("Administrator"))
                {
                    Console.WriteLine("Creating 'Administrator' role");
                    await roleManager.CreateAsync(new IdentityRole("Administrator"));
                }
                else
                {
                    Console.WriteLine("'Administrator' role already exists");
                }

                // Ensure the 'User' role exists
                if (!await roleManager.RoleExistsAsync("User"))
                {
                    Console.WriteLine("Creating 'User' role");
                    await roleManager.CreateAsync(new IdentityRole("User"));
                }
                else
                {
                    Console.WriteLine("'User' role already exists");
                }

                // Check if admin user exists
                var adminUser = await userManager.FindByEmailAsync("admin@email.com");

                if (adminUser == null)
                {
                    Console.WriteLine("Admin user doesn't exist yet, skipping role assignment");
                    return;
                }

                if (!(await userManager.IsInRoleAsync(adminUser, "admin")))
                {
                    Console.WriteLine("Adding admin user to 'admin' role");
                    await userManager.AddToRoleAsync(adminUser, "admin");
                }
                else
                {
                    Console.WriteLine("Admin user is already in 'admin' role");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error seeding roles and admin: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
            }
        }
    }
}