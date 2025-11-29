import React from "react";
import { Users } from "lucide-react";

export function CustomLobby() {

  return (
    <div className="min-h-screen w-screen bg-gray-100">
      <div className="grid grid-cols-[400px_1fr] gap-8 max-w-7xl mx-auto">
        {/* Left column - Waiting message (fixed) */}
        <div className="sticky top-0 h-screen flex items-center justify-center">
          <div className="text-center">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <Users className="w-20 h-20 text-gray-400" strokeWidth={1.5} />
            </div>

            {/* Main heading */}
            <h1 className="text-3xl font-semibold text-gray-900 mb-4">
              Waiting for other players
            </h1>

            {/* Subtext */}
            <p className="text-lg text-gray-500">
              Please wait up to 5 minutes for other participants.
            </p><br/>
            <p>
              If we can't assign you to a group within 5 minutes, we'll pay you $1.00 for your time.
            </p>
          </div>
        </div>

        {/* Right column - Content that scrolls with page */}
        <div className="py-12 px-8">
          <div className="h-[10vh]"></div> {/* Spacer to push content down 1/3 of viewport */}
          <div className="bg-white rounded-lg shadow-lg p-12 mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">While You Wait. . .</h2>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-4">
              Negotiation is a skill that can be learned and improved with practice. At its core, negotiation is about making choices under conditions of <strong>interdependence</strong>: two or more parties want something, and each party's success depends, at least in part, on the decisions of the others. While the art of negotiation can seem daunting, there are several fundamental concepts that provide a foundation for effective bargaining. Understanding these concepts can help negotiators achieve better outcomes and avoid common pitfalls.
            </p><p>
              One of the most important ideas in negotiation is the concept of <strong>BATNA</strong> and <strong>reservation price</strong>. BATNA stands for "Best Alternative to a Negotiated Agreement." It is essentially your fallback option—the "thing" you will pursue if the current negotiation fails. Your BATNA is not just abstract; it is the concrete alternative that protects you from agreeing to a deal that leaves you worse off than your options outside the negotiation. Closely related is the <strong>reservation price</strong>, which is the value of your BATNA quantified. It represents the minimum acceptable deal you are willing to accept. 
            </p><p>The number one rule of negotiation is simple: <strong>never accept a deal worse than your BATNA</strong>! Knowing your BATNA and reservation price gives you a clear boundary and helps prevent you from making poor concessions under pressure.
            </p><p>
              Negotiation can take many forms, but it is often classified into <strong>distributive</strong> and <strong>integrative</strong> types. <strong>Distributive negotiation</strong>, sometimes called "win-lose" negotiation, occurs when parties are competing over a fixed resource. For example, two people haggling over the price of a used car are engaged in a distributive negotiation. Every dollar one side gains is a dollar the other side loses. In these situations, the goal is often to claim as much value as possible. However, not all negotiation is purely competitive. Many negotiations involve multiple issues or dimensions, creating opportunities for trade-offs.
            </p><p>
              When negotiations span multiple issues, participants may need to accept outcomes that are less desirable on one point in order to gain more favorable outcomes on another. This process is known as <strong>logrolling</strong>. Logrolling allows negotiators to prioritize issues based on their own preferences and those of the other party, effectively creating deals that are better for everyone involved. For instance, in a workplace negotiation, one employee may value flexible working hours more than a bonus, while the employer may prefer to offer a higher bonus than flexible scheduling. By making trade-offs that reflect these differing priorities, both sides can leave the negotiation feeling satisfied, even though they did not get their top preference on every issue.
            </p><p>
              Negotiations that improve outcomes for all parties are referred to as <strong>integrative negotiations</strong>. Integrative negotiation seeks to "expand the pie" rather than simply dividing a fixed resource. It recognizes that participants often have different priorities and values across multiple issues. Understanding the nature of these issues is key. <strong>Compatible issues</strong> are those where everyone wants the same outcome, such as agreeing on a mutually convenient meeting time. <strong>Distributive issues</strong> involve opposing interests, like haggling over a single price. <strong>Integrative issues</strong> offer opportunities to create additional value: by making concessions on matters that are relatively unimportant to you while claiming more on matters that are highly important, you can allow others to do the same.
            </p><p>
             The essence of integrative negotiation lies in uncovering these differences in priorities and finding creative ways to satisfy them. For example, in a contract negotiation, a company may care most about timely delivery while the supplier may care about predictable production schedules. By structuring the deal so that the company guarantees orders within a flexible window, and the supplier gains predictability, both parties improve their outcome relative to what a purely distributive negotiation would have allowed. Integrative negotiation requires communication, trust, and a willingness to explore each other's interests beyond the obvious positions.
            </p><p>
              Even in seemingly simple negotiations, applying these principles can make a significant difference. Always identify your BATNA and calculate your reservation price before entering a discussion. Be aware of whether the issues at hand are distributive, compatible, or integrative. Look for opportunities to <strong>logroll</strong> by trading concessions on less important issues for gains on more important ones. And remember that negotiation does not have to be zero-sum; by exploring creative solutions, you can often find agreements that leave everyone better off.
            </p><p>
              In summary, successful negotiation requires preparation, awareness of alternatives, and strategic flexibility. Understanding your BATNA and reservation price provides a firm baseline, while differentiating between distributive and integrative issues enables smarter trade-offs. <strong>Logrolling</strong> and <strong>value creation</strong> are not just theoretical concepts—they are practical tools that allow negotiators to reach agreements that are both fair and efficient. By applying these basic principles, anyone can improve their negotiation outcomes and approach discussions with confidence and clarity.
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
