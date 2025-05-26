import { motion } from 'framer-motion'
import { Code, Coffee, Heart, Zap } from 'lucide-react'

const About = () => {
  const highlights = [
    {
      icon: <Code className="w-6 h-6" />,
      title: "Clean Code",
      description: "Writing maintainable and scalable code"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Performance",
      description: "Optimizing for speed and efficiency"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "User Experience",
      description: "Creating intuitive and delightful interfaces"
    },
    {
      icon: <Coffee className="w-6 h-6" />,
      title: "Continuous Learning",
      description: "Always exploring new technologies"
    }
  ]

  return (
    <section id="about" className="section-padding bg-white">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            About <span className="gradient-text">Me</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Passionate developer with a love for creating innovative solutions
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-semibold text-gray-900">
              Hello! I'm Minner, a passionate full-stack developer.
            </h3>
            
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                I'm a dedicated software developer with a strong foundation in modern web technologies. 
                My journey in programming started with curiosity and has evolved into a passion for 
                creating meaningful digital experiences.
              </p>
              
              <p>
                I specialize in building responsive web applications using React, TypeScript, and Node.js. 
                I'm always eager to learn new technologies and apply them to solve real-world problems.
              </p>
              
              <p>
                When I'm not coding, you can find me exploring new technologies, contributing to open-source 
                projects, or sharing knowledge with the developer community.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                Problem Solver
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                Team Player
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Fast Learner
              </span>
            </div>
          </motion.div>

          {/* Right side - Highlights grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-6"
          >
            {highlights.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-6 text-center"
              >
                <div className="text-primary-600 mb-4 flex justify-center">
                  {item.icon}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {item.title}
                </h4>
                <p className="text-sm text-gray-600">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Stats section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">2+</div>
            <div className="text-gray-600">Years Experience</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">10+</div>
            <div className="text-gray-600">Projects Completed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">5+</div>
            <div className="text-gray-600">Technologies</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">100%</div>
            <div className="text-gray-600">Commitment</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default About 