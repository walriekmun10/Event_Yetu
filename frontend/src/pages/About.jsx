import React from 'react';
import { Heart, Target, Award, Users, Calendar, CheckCircle } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Customer First',
      description: 'Your satisfaction is our top priority. We go above and beyond to make your event perfect.'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Excellence',
      description: 'We partner with the best service providers to ensure top-quality event experiences.'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Community',
      description: 'Building strong relationships between event planners and service providers across Kenya.'
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: 'Reliability',
      description: 'Trusted by thousands for seamless event planning and execution.'
    }
  ];

  const timeline = [
    { year: '2020', title: 'Founded', description: 'Event Yetu was born with a vision to transform event planning in Kenya' },
    { year: '2021', title: 'Growth', description: 'Partnered with 100+ service providers across major cities' },
    { year: '2023', title: 'Innovation', description: 'Launched multi-service bookings and premium packages' },
    { year: '2025', title: 'Leading Platform', description: 'Kenya\'s #1 event management platform with 500+ successful events' }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">About Event Yetu</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            We're on a mission to make event planning effortless, reliable, and memorable for everyone in Kenya
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full mb-6">
                <Target className="w-5 h-5" />
                <span className="font-semibold">Our Mission</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Transforming Event Planning in Kenya
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Event Yetu was created to solve a simple problem: event planning shouldn't be stressful. 
                We bring together the best service providers, streamline the booking process, and ensure 
                every event is executed flawlessly.
              </p>
              <p className="text-lg text-gray-600">
                Whether you're planning a wedding, birthday, corporate event, or any celebration, 
                we provide the tools and services you need to make it perfect.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-indigo-50 p-6 rounded-2xl">
                <div className="text-4xl font-bold text-indigo-600 mb-2">500+</div>
                <div className="text-gray-700 font-medium">Events Hosted</div>
              </div>
              <div className="bg-purple-50 p-6 rounded-2xl">
                <div className="text-4xl font-bold text-purple-600 mb-2">200+</div>
                <div className="text-gray-700 font-medium">Service Providers</div>
              </div>
              <div className="bg-pink-50 p-6 rounded-2xl">
                <div className="text-4xl font-bold text-pink-600 mb-2">98%</div>
                <div className="text-gray-700 font-medium">Satisfaction Rate</div>
              </div>
              <div className="bg-yellow-50 p-6 rounded-2xl">
                <div className="text-4xl font-bold text-yellow-600 mb-2">24/7</div>
                <div className="text-gray-700 font-medium">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mb-6">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Journey</h2>
            <p className="text-xl text-gray-600">
              From humble beginnings to Kenya's leading event platform
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-indigo-600 to-purple-600"></div>

            {timeline.map((item, index) => (
              <div key={index} className={`relative mb-16 ${index % 2 === 0 ? 'text-right pr-1/2' : 'text-left pl-1/2'}`}>
                <div className={`flex items-center ${index % 2 === 0 ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-1 ${index % 2 === 0 ? 'pr-12' : 'pl-12'}`}>
                    <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                      <div className="text-2xl font-bold text-indigo-600 mb-2">{item.year}</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  
                  {/* Timeline Dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white border-4 border-indigo-600 rounded-full z-10"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Built by Event Enthusiasts
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Our team combines years of event planning experience with cutting-edge technology 
            to deliver the best platform for your events.
          </p>
          
          <div className="bg-white p-12 rounded-3xl shadow-xl max-w-4xl mx-auto">
            <p className="text-lg text-gray-700 mb-8 italic">
              "We started Event Yetu because we saw how challenging it was to coordinate multiple 
              service providers for events. Our platform brings everything together - one booking, 
              one payment, one seamless experience."
            </p>
            <div className="flex items-center justify-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                EY
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">Event Yetu Team</div>
                <div className="text-gray-600">Founders & Developers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">Join Thousands of Happy Clients</h2>
          <p className="text-xl text-white/90 mb-8">
            Experience stress-free event planning with Event Yetu
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <a
              href="/register"
              className="bg-white text-indigo-600 px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors"
            >
              Get Started
            </a>
            <a
              href="/contact"
              className="border-2 border-white text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
