using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading.Tasks;
using Intex2.Models;

namespace Intex2.Data
{
    public static class IdentitySeeder
    {
        public static async Task SeedRolesAndAdmin(IServiceProvider serviceProvider)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

            if (!await roleManager.RoleExistsAsync("admin"))
            {
                await roleManager.CreateAsync(new IdentityRole("admin"));
            }

            var adminUser = await userManager.FindByEmailAsync("admin@email.com");

            if (adminUser != null && !(await userManager.IsInRoleAsync(adminUser, "admin")))
            {
                await userManager.AddToRoleAsync(adminUser, "admin");
            }
        }
    }
}